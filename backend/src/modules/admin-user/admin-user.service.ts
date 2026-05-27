import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { AdminUserPageQueryDto } from './dto/admin-user-page-query.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { UpdateSelfDto } from './dto/update-self.dto';
import { RoleType } from '../../common/constants/business.constants';

@Injectable()
export class AdminUserService {
  private readonly logger = new Logger(AdminUserService.name);

  constructor(
    @InjectRepository(AdminUser) private userRepo: Repository<AdminUser>,
  ) {}

  async list(query: AdminUserPageQueryDto) {
    const { page = 1, pageSize = 10 } = query;
    const qb = this.userRepo.createQueryBuilder('u');

    if (query.username) {
      qb.andWhere('u.username ILIKE :username', { username: `%${query.username}%` });
    }
    if (query.roleType) {
      qb.andWhere('u.roleType = :roleType', { roleType: query.roleType });
    }

    qb.orderBy('u.id', 'ASC').skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();

    // 不返回密码哈希
    const safeList = list.map(({ passwordHash, ...rest }) => rest);
    return { list: safeList, total, page, pageSize };
  }

  async create(dto: CreateAdminUserDto) {
    const existing = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existing) {
      throw new ConflictException('用户名已存在');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    // super_admin 不需要存储 permissions（null = 全部权限）
    const permissions = dto.roleType === RoleType.SUPER_ADMIN ? null : (dto.permissions ?? null);
    const entity = this.userRepo.create({
      username: dto.username,
      passwordHash,
      roleType: dto.roleType,
      status: dto.status ?? 1,
      permissions,
    });
    const saved = await this.userRepo.save(entity);
    const { passwordHash: _, ...rest } = saved;
    return rest;
  }

  async update(id: number, dto: UpdateAdminUserDto, currentUserId?: number) {
    const entity = await this.userRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('用户不存在');

    // 处理 permissions：如果修改了角色为 super_admin，清除 permissions
    if (dto.roleType !== undefined) {
      entity.roleType = dto.roleType;
      if (dto.roleType === RoleType.SUPER_ADMIN) {
        entity.permissions = null;
      }
    }
    if (dto.status !== undefined) {
      entity.status = dto.status;
    }
    if (dto.permissions !== undefined) {
      // 只有 admin 才存储 permissions
      if (entity.roleType === RoleType.ADMIN) {
        entity.permissions = dto.permissions;
      }
    }

    const saved = await this.userRepo.save(entity);
    const { passwordHash: _, ...rest } = saved;
    return rest;
  }

  async delete(id: number, currentUserId?: number) {
    const entity = await this.userRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('用户不存在');

    if (entity.roleType === RoleType.SUPER_ADMIN) {
      throw new ForbiddenException('不允许删除超级管理员');
    }

    if (currentUserId && entity.id === currentUserId) {
      throw new ForbiddenException('不允许删除自己');
    }

    await this.userRepo.delete(id);
  }

  async resetPassword(id: number) {
    const entity = await this.userRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('用户不存在');

    const passwordHash = await bcrypt.hash('admin123', 10);
    entity.passwordHash = passwordHash;
    // 使所有旧 JWT 失效
    entity.jwtVersion = (entity.jwtVersion || 0) + 1;
    await this.userRepo.save(entity);

    return { message: '密码已重置为 admin123' };
  }

  /**
   * 管理员设置任意用户的密码（不需要旧密码）
   */
  async setPassword(id: number, dto: SetPasswordDto) {
    const entity = await this.userRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('用户不存在');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    entity.passwordHash = passwordHash;
    // 使所有旧 JWT 失效
    entity.jwtVersion = (entity.jwtVersion || 0) + 1;
    await this.userRepo.save(entity);

    return { message: '密码修改成功' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const entity = await this.userRepo.findOne({ where: { id: userId } });
    if (!entity) throw new NotFoundException('用户不存在');

    // 校验旧密码
    const isMatch = await bcrypt.compare(dto.oldPassword, entity.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('旧密码不正确');
    }

    // 校验新旧密码不能相同
    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException('新密码不能与旧密码相同');
    }

    // Hash 新密码
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    entity.passwordHash = passwordHash;
    // 使所有旧 JWT 失效
    entity.jwtVersion = (entity.jwtVersion || 0) + 1;
    await this.userRepo.save(entity);

    return { message: '密码修改成功，请重新登录' };
  }

  async updateSelf(userId: number, dto: UpdateSelfDto) {
    const entity = await this.userRepo.findOne({ where: { id: userId } });
    if (!entity) throw new NotFoundException('用户不存在');

    // 只允许修改 username
    if (dto.username !== undefined) {
      // 检查用户名是否被其他用户占用
      const existing = await this.userRepo.findOne({ where: { username: dto.username } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('用户名已存在');
      }
      entity.username = dto.username;
    }

    const saved = await this.userRepo.save(entity);
    const { passwordHash: _, ...rest } = saved;
    return rest;
  }
}

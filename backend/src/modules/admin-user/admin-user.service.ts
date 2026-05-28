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
import { DEFAULT_ADMIN_PERMISSIONS, PERMISSION_SET } from '../../common/constants/permission.constants';
import { RequestUser } from '../../common/interfaces/request-user.interface';

@Injectable()
export class AdminUserService {
  private readonly logger = new Logger(AdminUserService.name);

  constructor(
    @InjectRepository(AdminUser) private userRepo: Repository<AdminUser>,
  ) {}

  private normalizePermissions(roleType: RoleType, permissions?: string[] | null) {
    if (roleType === RoleType.SUPER_ADMIN) {
      return null;
    }

    const source = permissions ?? [...DEFAULT_ADMIN_PERMISSIONS];
    const normalized = Array.from(new Set(source.filter(Boolean)));
    const invalidPermissions = normalized.filter((permission) => !PERMISSION_SET.has(permission));

    if (invalidPermissions.length) {
      throw new BadRequestException(`存在无效权限值: ${invalidPermissions.join(', ')}`);
    }

    return normalized;
  }

  private ensureAdminCanManageRole(currentUser: RequestUser | undefined, targetRoleType: string | undefined) {
    if (currentUser?.roleType !== RoleType.ADMIN) {
      return;
    }

    if (targetRoleType === RoleType.SUPER_ADMIN) {
      throw new ForbiddenException('管理员无权操作超级管理员');
    }
  }

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

    const safeList = list.map(({ passwordHash, ...rest }) => rest);
    return { list: safeList, total, page, pageSize };
  }

  async create(dto: CreateAdminUserDto, currentUser?: RequestUser) {
    const existing = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existing) {
      throw new ConflictException('用户名已存在');
    }

    this.ensureAdminCanManageRole(currentUser, dto.roleType);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const permissions = this.normalizePermissions(dto.roleType, dto.permissions ?? null);
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

  async update(id: number, dto: UpdateAdminUserDto, currentUser?: RequestUser) {
    const entity = await this.userRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('用户不存在');

    this.ensureAdminCanManageRole(currentUser, entity.roleType);

    const nextRoleType = dto.roleType ?? (entity.roleType as RoleType);
    this.ensureAdminCanManageRole(currentUser, nextRoleType);

    if (dto.roleType !== undefined) {
      entity.roleType = dto.roleType;
    }
    if (dto.status !== undefined) {
      entity.status = dto.status;
    }
    if (dto.permissions !== undefined || dto.roleType !== undefined) {
      entity.permissions = this.normalizePermissions(nextRoleType, dto.permissions ?? entity.permissions ?? null);
    }

    const saved = await this.userRepo.save(entity);
    const { passwordHash: _, ...rest } = saved;
    return rest;
  }

  async delete(id: number, currentUser?: RequestUser) {
    const entity = await this.userRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('用户不存在');

    if (entity.roleType === RoleType.SUPER_ADMIN) {
      throw new ForbiddenException('不允许删除超级管理员');
    }

    if (currentUser?.id && entity.id === currentUser.id) {
      throw new ForbiddenException('不允许删除自己');
    }

    this.ensureAdminCanManageRole(currentUser, entity.roleType);

    await this.userRepo.delete(id);
  }

  async resetPassword(id: number, currentUser?: RequestUser) {
    const entity = await this.userRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('用户不存在');

    this.ensureAdminCanManageRole(currentUser, entity.roleType);

    const passwordHash = await bcrypt.hash('admin123', 10);
    entity.passwordHash = passwordHash;
    entity.jwtVersion = (entity.jwtVersion || 0) + 1;
    await this.userRepo.save(entity);

    return { message: '密码已重置为 admin123' };
  }

  async setPassword(id: number, dto: SetPasswordDto, currentUser?: RequestUser) {
    const entity = await this.userRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('用户不存在');

    this.ensureAdminCanManageRole(currentUser, entity.roleType);

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    entity.passwordHash = passwordHash;
    entity.jwtVersion = (entity.jwtVersion || 0) + 1;
    await this.userRepo.save(entity);

    return { message: '密码修改成功' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const entity = await this.userRepo.findOne({ where: { id: userId } });
    if (!entity) throw new NotFoundException('用户不存在');

    const isMatch = await bcrypt.compare(dto.oldPassword, entity.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('旧密码不正确');
    }

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException('新密码不能与旧密码相同');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    entity.passwordHash = passwordHash;
    entity.jwtVersion = (entity.jwtVersion || 0) + 1;
    await this.userRepo.save(entity);

    return { message: '密码修改成功，请重新登录' };
  }

  async updateSelf(userId: number, dto: UpdateSelfDto) {
    const entity = await this.userRepo.findOne({ where: { id: userId } });
    if (!entity) throw new NotFoundException('用户不存在');

    if (dto.username !== undefined) {
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

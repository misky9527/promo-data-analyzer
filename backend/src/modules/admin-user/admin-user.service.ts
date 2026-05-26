import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { AdminUserPageQueryDto } from './dto/admin-user-page-query.dto';
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
    const entity = this.userRepo.create({
      username: dto.username,
      passwordHash,
      roleType: dto.roleType,
      status: dto.status ?? 1,
    });
    const saved = await this.userRepo.save(entity);
    const { passwordHash: _, ...rest } = saved;
    return rest;
  }

  async update(id: number, dto: UpdateAdminUserDto, currentUserId?: number) {
    const entity = await this.userRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('用户不存在');

    Object.assign(entity, dto);
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
}

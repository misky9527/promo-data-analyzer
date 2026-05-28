import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../../modules/auth/entities/admin-user.entity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    @InjectRepository(AdminUser) private userRepo: Repository<AdminUser>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('缺少认证令牌');

    try {
      const payload = this.jwtService.verify(token) as {
        sub: number;
        username: string;
        roleType: string;
        jwtVersion: number;
      };

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || user.status !== 1) {
        throw new UnauthorizedException('用户不存在或已被禁用');
      }
      if ((user.jwtVersion || 0) !== (payload.jwtVersion || 0)) {
        throw new UnauthorizedException('登录状态已失效，请重新登录');
      }

      request.user = {
        id: user.id,
        username: user.username,
        roleType: user.roleType,
        jwtVersion: user.jwtVersion,
        permissions: user.permissions,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('令牌无效或已过期');
    }
    return true;
  }

  private extractToken(req: any): string | null {
    const auth = req.headers?.authorization;
    if (!auth) return null;
    const [type, token] = auth.split(' ');
    return type === 'Bearer' ? token : null;
  }
}

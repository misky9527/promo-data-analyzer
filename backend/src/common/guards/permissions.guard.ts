import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_SUPER_ADMIN } from '../constants/business.constants';
import { REQUIRED_PERMISSION_KEY } from '../decorators/required-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('未认证');
    }

    if (user.roleType === ROLE_SUPER_ADMIN) {
      return true;
    }

    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    const hasPermission = requiredPermissions.some((permission) => permissions.includes(permission));
    if (!hasPermission) {
      throw new ForbiddenException('权限不足');
    }

    return true;
  }
}

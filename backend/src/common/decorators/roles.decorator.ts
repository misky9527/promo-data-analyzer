import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants/business.constants';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const Public = () => SetMetadata('isPublic', true);

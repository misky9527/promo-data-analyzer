export const ROLE_SUPER_ADMIN = 'super_admin';
export const ROLES_KEY = 'roles';

export enum DictStatus {
  ACTIVE = 1,
  INACTIVE = 0,
}

export enum AnalysisType {
  SINGLE_PERIOD = 'single_period',
  DUAL_PERIOD = 'dual_period',
  MULTI_CHANNEL = 'multi_channel',
}

export enum ImportMode {
  APPEND = 'append',
  OVERWRITE = 'overwrite',
}

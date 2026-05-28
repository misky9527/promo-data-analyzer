export interface RequestUser {
  id: number;
  username: string;
  roleType: string;
  jwtVersion: number;
  permissions: string[] | null;
}

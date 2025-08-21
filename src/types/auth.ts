export type UserRoleType = 'admin' | 'host' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRoleType;
  mfaEnabled: boolean;
  mfaVerified?: boolean;
  mfaSecret?: string;
  mfaTempSecret?: string;
  emailVerified?: boolean;
}

export const UserRole = {
  ADMIN: 'admin' as const,
  HOST: 'host' as const,
  GUEST: 'guest' as const,
} as const;

import bcrypt from 'bcryptjs';
import { UserRole } from '@/types/auth';

export const seedUsers = async () => {
  // These would typically be in a database, but for testing we'll store them in memory
  const users = new Map();

  // Create default users with hashed passwords
  const defaultUsers = [
    {
      id: 'guest-1',
      email: 'guest@rovers.com',
      name: 'Guest User',
      role: UserRole.GUEST,
      password: 'Guest@123', // In production, never store plain text passwords
      mfaEnabled: false,
      mfaVerified: false
    },
    {
      id: 'host-1',
      email: 'host@rovers.com',
      name: 'Host User',
      role: UserRole.HOST,
      password: 'Host@123',
      mfaEnabled: false,
      mfaVerified: false
    },
    {
      id: 'admin-1',
      email: 'admin@rovers.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      password: 'Admin@123',
      mfaEnabled: false,
      mfaVerified: false
    }
  ];

  // Hash passwords and store users
  for (const user of defaultUsers) {
    const { password, ...userWithoutPassword } = user;
    const passwordHash = await bcrypt.hash(password, 12);
    users.set(user.email, {
      ...userWithoutPassword,
      passwordHash
    });
  }

  return users;
};

// Export test credentials for easy reference
export const TEST_CREDENTIALS = {
  guest: {
    email: 'guest@rovers.com',
    password: 'Guest@123'
  },
  host: {
    email: 'host@rovers.com',
    password: 'Host@123'
  },
  admin: {
    email: 'admin@rovers.com',
    password: 'Admin@123'
  }
};

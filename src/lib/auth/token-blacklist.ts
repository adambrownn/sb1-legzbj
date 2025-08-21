import redisClient from '../redis';

const BLACKLIST_PREFIX = 'token:blacklist:';
const DEFAULT_BLACKLIST_TTL = 24 * 60 * 60; // 24 hours in seconds

export class TokenBlacklistService {
  private static instance: TokenBlacklistService;

  private constructor() {}

  public static getInstance(): TokenBlacklistService {
    if (!TokenBlacklistService.instance) {
      TokenBlacklistService.instance = new TokenBlacklistService();
    }
    return TokenBlacklistService.instance;
  }

  /**
   * Add a token to the blacklist
   * @param token The token to blacklist
   * @param expiryInSeconds Time in seconds until the token expires (optional)
   */
  async blacklistToken(token: string, expiryInSeconds: number = DEFAULT_BLACKLIST_TTL): Promise<void> {
    const key = `${BLACKLIST_PREFIX}${token}`;
    await redisClient.setEx(key, expiryInSeconds, 'blacklisted');
  }

  /**
   * Check if a token is blacklisted
   * @param token The token to check
   * @returns boolean indicating if the token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const key = `${BLACKLIST_PREFIX}${token}`;
    const result = await redisClient.get(key);
    return result !== null;
  }

  /**
   * Remove a token from the blacklist
   * @param token The token to remove from the blacklist
   */
  async removeFromBlacklist(token: string): Promise<void> {
    const key = `${BLACKLIST_PREFIX}${token}`;
    await redisClient.del(key);
  }
}

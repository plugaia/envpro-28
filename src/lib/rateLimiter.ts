// Simple client-side rate limiter for sensitive operations
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 5) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  private getKey(action: string, identifier?: string): string {
    return identifier ? `${action}:${identifier}` : action;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  isAllowed(action: string, identifier?: string): boolean {
    this.cleanup();
    
    const key = this.getKey(action, identifier);
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (now >= entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingTime(action: string, identifier?: string): number {
    const key = this.getKey(action, identifier);
    const entry = this.limits.get(key);
    
    if (!entry) return 0;
    
    const remaining = entry.resetTime - Date.now();
    return Math.max(0, remaining);
  }
}

// Create rate limiters for different actions
export const authLimiter = new RateLimiter(300000, 3); // 3 attempts per 5 minutes
export const proposalLimiter = new RateLimiter(60000, 10); // 10 proposals per minute
export const invitationLimiter = new RateLimiter(3600000, 5); // 5 invitations per hour
export const exportLimiter = new RateLimiter(300000, 2); // 2 exports per 5 minutes
export const passwordResetLimiter = new RateLimiter(900000, 3); // 3 resets per 15 minutes

// Rate limit utility function
export const checkRateLimit = (
  limiter: RateLimiter, 
  action: string, 
  identifier?: string
): { allowed: boolean; remainingTime?: number } => {
  const allowed = limiter.isAllowed(action, identifier);
  
  if (!allowed) {
    const remainingTime = limiter.getRemainingTime(action, identifier);
    return { allowed: false, remainingTime };
  }
  
  return { allowed: true };
};

// Format remaining time for user display
export const formatRemainingTime = (ms: number): string => {
  const minutes = Math.ceil(ms / 60000);
  const seconds = Math.ceil((ms % 60000) / 1000);
  
  if (minutes > 1) {
    return `${minutes} minutos`;
  } else if (minutes === 1) {
    return '1 minuto';
  } else {
    return `${seconds} segundos`;
  }
};
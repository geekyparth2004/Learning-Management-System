import { Redis } from "@upstash/redis";

// Initialize Redis client (lazy - only connects when needed)
let redis: Redis | null = null;

function getRedis(): Redis | null {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.warn("[REDIS] Missing credentials - caching disabled");
        return null;
    }

    if (!redis) {
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
    }
    return redis;
}

// TTL presets (in seconds)
export const CACHE_TTL = {
    SHORT: 60,           // 1 minute - for frequently changing data (streak, user data)
    MEDIUM: 300,         // 5 minutes - for semi-static data (courses, modules)
    LONG: 600,           // 10 minutes - for static data (problems, test cases)
    VERY_LONG: 3600,     // 1 hour - for rarely changing data
} as const;

/**
 * Get cached value
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
    try {
        const client = getRedis();
        if (!client) return null;

        const cached = await client.get<T>(key);
        return cached;
    } catch (error) {
        console.error("[REDIS] Get error:", error);
        return null;
    }
}

/**
 * Set cached value with TTL
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number = CACHE_TTL.MEDIUM): Promise<boolean> {
    try {
        const client = getRedis();
        if (!client) return false;

        await client.set(key, value, { ex: ttlSeconds });
        return true;
    } catch (error) {
        console.error("[REDIS] Set error:", error);
        return false;
    }
}

/**
 * Delete a specific cache key
 */
export async function cacheDelete(key: string): Promise<boolean> {
    try {
        const client = getRedis();
        if (!client) return false;

        await client.del(key);
        return true;
    } catch (error) {
        console.error("[REDIS] Delete error:", error);
        return false;
    }
}

/**
 * Delete all keys matching a pattern (use sparingly)
 */
export async function cacheDeletePattern(pattern: string): Promise<boolean> {
    try {
        const client = getRedis();
        if (!client) return false;

        // Use SCAN to find keys matching pattern
        let cursor = 0;
        do {
            const [newCursor, keys] = await client.scan(cursor, { match: pattern, count: 100 });
            cursor = Number(newCursor);

            if (keys.length > 0) {
                await client.del(...keys);
            }
        } while (cursor !== 0);

        return true;
    } catch (error) {
        console.error("[REDIS] Delete pattern error:", error);
        return false;
    }
}

/**
 * Cache-aside pattern helper: get from cache or fetch and cache
 */
export async function cacheGetOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = CACHE_TTL.MEDIUM
): Promise<T> {
    // Try cache first
    const cached = await cacheGet<T>(key);
    if (cached !== null) {
        return cached;
    }

    // Fetch fresh data
    const fresh = await fetchFn();

    // Cache it (don't await, fire and forget)
    cacheSet(key, fresh, ttlSeconds).catch(() => { });

    return fresh;
}

// Cache key generators
export const CACHE_KEYS = {
    courses: () => "courses:all",
    course: (id: string) => `course:${id}`,
    courseModules: (courseId: string) => `course:${courseId}:modules`,
    problems: () => "problems:all",
    problem: (id: string) => `problem:${id}`,
    userStreak: (userId: string) => `user:${userId}:streak`,
    leaderboard: () => "leaderboard",
} as const;

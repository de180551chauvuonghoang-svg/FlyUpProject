import NodeCache from 'node-cache';

// Initialize NodeCache (5 minute default TTL)
const nodeCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

console.log('✅ In-memory Cache initialized (Replacing Redis)');

// Store for rate limiting since NodeCache doesn't have an atomic 'incr' that works exactly like Redis
const rateLimitStore = new Map();

/**
 * Mock Redis interface to avoid breaking existing code
 */
const redis = {
  // Mock 'incr' for rate limiting
  incr: async (key) => {
    const current = rateLimitStore.get(key) || 0;
    const next = current + 1;
    rateLimitStore.set(key, next);
    return next;
  },

  // Mock 'expire' for rate limiting
  expire: async (key, seconds) => {
    setTimeout(() => {
      rateLimitStore.delete(key);
    }, seconds * 1000);
    return 1;
  },

  // Mock 'ttl' for rate limiting
  ttl: async (key) => {
    // In a simple Map-based store, we don't easily track TTL
    // Returning a default or estimated value
    return 60; 
  },

  // Mock 'get' for general usage
  get: async (key) => nodeCache.get(key),

  // Mock 'set' for general usage
  set: async (key, value, mode, duration) => {
    if (mode === 'EX' || mode === 'PX') {
      const ttl = mode === 'EX' ? duration : Math.ceil(duration / 1000);
      return nodeCache.set(key, value, ttl);
    }
    return nodeCache.set(key, value);
  },

  // Mock 'setex' for summary caching
  setex: async (key, seconds, value) => {
    return nodeCache.set(key, value, seconds);
  },

  // Mock 'del' for clearing history
  del: async (...keys) => {
    let deleted = 0;
    keys.forEach(key => {
      if (nodeCache.del(key)) deleted++;
    });
    return deleted;
  },

  // Mock 'rpush' for list-like storage (history)
  rpush: async (key, value) => {
    const list = nodeCache.get(key) || [];
    list.push(value);
    nodeCache.set(key, list, 3600); // 1 hour default TTL for history
    return list.length;
  },

  // Mock 'lrange' for retrieving history
  lrange: async (key, start, end) => {
    const list = nodeCache.get(key) || [];
    if (end === -1) {
      return list.slice(start);
    }
    return list.slice(start, end + 1);
  },

  // Mock 'llen' for history count
  llen: async (key) => {
    const list = nodeCache.get(key) || [];
    return list.length;
  },

  // EventEmitter mocks to prevent errors on event listeners
  on: (event, callback) => {
    if (event === 'connect') {
      // simulate async connect for consistency
      setTimeout(() => callback(), 0);
    }
    // Ignore error/other event listeners
  }
};

/**
 * Helper to prevent app from hanging
 */
export const safeGet = async (key) => {
  try {
    const result = nodeCache.get(key);
    return result || null;
  } catch (error) {
    return null;
  }
};

/**
 * Helper to set cache
 */
export const safeSet = async (key, value, mode, duration) => {
  try {
    if (mode === 'EX') {
      nodeCache.set(key, value, duration);
    } else {
      nodeCache.set(key, value);
    }
  } catch (error) {
    // Ignore cache set failures
  }
};

export default redis;

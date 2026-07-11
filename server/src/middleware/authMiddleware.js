import { supabase } from '../utils/db.js';
import '../config/env.js';

/**
 * Core authentication middleware.
 * Verifies the Custom JWT from the Authorization header.
 * Attaches req.user and req.userId on success.
 * Returns 401 on missing/invalid/expired tokens.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Missing or malformed Authorization header. Expected: Bearer <token>'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Invalid token provided'
      });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      const isExpired = error?.message?.toLowerCase().includes('expired');
      return res.status(401).json({ 
        error: isExpired ? 'Session expired' : 'Invalid token',
        message: isExpired 
          ? 'Your session has expired. Please log in again.' 
          : 'The provided authentication token is invalid.'
      });
    }

    // Attach verified user info to request
    req.user = user;
    req.userId = user.id;
    req.userEmail = user.email;

    next();
  } catch (err) {
    console.error('[Auth Middleware] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Authentication service error' });
  }
};

/**
 * Optional auth middleware for routes that may or may not have authentication.
 * Used for webhook endpoints that are called by external services.
 * If a valid token is present, attaches req.user. Otherwise, continues without auth.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No auth header — that's fine for optional auth
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
      return next();
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      req.user = user;
      req.userId = user.id;
      req.userEmail = user.email;
    }

    next();
  } catch {
    // Silently continue — optional auth should never block
    next();
  }
};

export default { authenticate, optionalAuth };


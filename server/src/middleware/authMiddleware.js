import { createClient } from '@supabase/supabase-js';
import '../config/env.js';

// Create a dedicated Supabase client for auth verification
// Uses the anon key — sufficient for token verification via auth.getUser()
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

/**
 * Core authentication middleware.
 * Verifies the Supabase JWT from the Authorization header.
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

    // Create a temporary client with the user's token to verify it
    // This validates signature, expiry, and returns the user object
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // Distinguish between expired and invalid tokens
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

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    });

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

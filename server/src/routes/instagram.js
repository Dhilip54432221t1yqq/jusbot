import express from 'express';
import { supabase } from '../utils/supabase.js';
import { igService } from '../services/igService.js';
import { webhookService } from '../services/webhookService.js';
import { facebookConfig } from '../config/facebookConfig.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth to all non-webhook routes
router.use((req, res, next) => {
  // Webhook endpoints are public (called by Meta servers)
  if (req.path === '/webhook') return next();
  return authenticate(req, res, next);
});

/**
 * GET /api/instagram/auth-url
 * Returns the Facebook Login URL for Business
 */
router.get('/auth-url', (req, res) => {
  const { workspaceId } = req.query;
  const url = `https://www.facebook.com/${facebookConfig.apiVersion}/dialog/oauth?` + 
    `client_id=${facebookConfig.appId}` +
    `&redirect_uri=${encodeURIComponent(facebookConfig.redirectUri)}` +
    `&scope=${facebookConfig.scopes.join(',')}` +
    `&response_type=code` +
    (workspaceId ? `&state=${workspaceId}` : '');
  console.log('Generated FB Auth URL:', url);
  res.json({ url });
});

/**
 * POST /api/instagram/exchange-token
 * Exchange auth code for long-lived token and link IG account
 */
router.post('/exchange-token', async (req, res) => {
  const { code, workspaceId, userId } = req.body;

  if (!code || !workspaceId || !userId) {
    return res.status(400).json({ error: 'Missing required fields: code, workspaceId, or userId' });
  }

  try {
    // 1. Exchange code for short-lived token
    const tokenData = await igService.getLongLivedToken(code);
    const accessToken = tokenData.access_token;

    // 2. Fetch Facebook Pages to find the IG link
    const pages = await igService.getFacebookPages(accessToken);
    if (!pages || pages.length === 0) {
      return res.status(404).json({ error: 'No Facebook Pages found associated with this account.' });
    }

    // For simplicity, we'll try to find the first page with an IG account. 
    // In a production app, you'd let the user select the page.
    let linkedIgAccountId = null;
    let selectedPageId = null;

    for (const page of pages) {
      const igId = await igService.getInstagramAccountId(page.id, accessToken);
      if (igId) {
        linkedIgAccountId = igId;
        selectedPageId = page.id;
        break;
      }
    }

    if (!linkedIgAccountId) {
      return res.status(404).json({ error: 'No Instagram Business account linked to your Facebook Pages.' });
    }

    // 3. Fetch IG Account Details
    const igDetails = await igService.getAccountDetails(linkedIgAccountId, accessToken);

    // 4. Store/Update Instagram Account in DB
    const { data: account, error: accountError } = await supabase
      .from('instagram_accounts')
      .upsert({
        user_id: userId,
        workspace_id: workspaceId,
        page_id: selectedPageId,
        ig_user_id: linkedIgAccountId,
        username: igDetails.username,
        full_name: igDetails.name,
        profile_picture_url: igDetails.profile_picture_url,
        followers_count: igDetails.followers_count,
        media_count: igDetails.media_count,
        updated_at: new Date()
      }, { onConflict: 'ig_user_id' })
      .select()
      .single();

    if (accountError) throw accountError;

    // 5. Store Long-Lived Token
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 5184000)); // Default 60 days

    const { error: tokenError } = await supabase
      .from('instagram_tokens')
      .upsert({
        ig_user_id: linkedIgAccountId,
        access_token: accessToken,
        expires_at: expiresAt,
        updated_at: new Date()
      }, { onConflict: 'ig_user_id' });

    if (tokenError) throw tokenError;

    res.json({ success: true, account });
  } catch (error) {
    console.error('Token exchange failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/instagram/overview/check/:workspaceId
 * Returns if an Instagram account is connected
 */
router.get('/overview/check/:workspaceId', async (req, res) => {
  const { workspaceId } = req.params;
  try {
    const { data: account } = await supabase
      .from('instagram_accounts')
      .select('ig_user_id')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    res.json({ connected: !!account });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/instagram/overview/details/:workspaceId
 */
router.get('/overview/details/:workspaceId', async (req, res) => {
  const { workspaceId } = req.params;
  try {
    const { data: account, error: accError } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (accError || !account) return res.status(404).json({ error: 'Account not found' });

    res.json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/instagram/overview/:igUserId
 */
router.get('/overview/:igUserId', async (req, res) => {
  const { igUserId } = req.params;

  try {
    const { data: tokenData } = await supabase
      .from('instagram_tokens')
      .select('access_token')
      .eq('ig_user_id', igUserId)
      .single();

    if (!tokenData) return res.status(404).json({ error: 'Instagram account not connected or token missing.' });

    const details = await igService.getAccountDetails(igUserId, tokenData.access_token);
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/instagram/media/:igUserId
 */
router.get('/media/:igUserId', async (req, res) => {
  const { igUserId } = req.params;

  try {
    const { data: tokenData } = await supabase
      .from('instagram_tokens')
      .select('access_token')
      .eq('ig_user_id', igUserId)
      .single();

    if (!tokenData) return res.status(404).json({ error: 'Instagram account not connected.' });

    const media = await igService.getMediaList(igUserId, tokenData.access_token);
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Webhook Verification (GET)
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

/**
 * Webhook Payload (POST)
 */
router.post('/webhook', async (req, res) => {
  const body = req.body;
  
  try {
    await webhookService.handleInstagramEvent(body);
    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.sendStatus(500);
  }
});

export default router;

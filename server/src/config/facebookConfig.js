import '../config/env.js';

export const facebookConfig = {
  appId: process.env.FB_APP_ID,
  appSecret: process.env.FB_APP_SECRET,
  redirectUri: process.env.FB_REDIRECT_URI,
  apiVersion: process.env.FB_API_VERSION || 'v25.0',
  scopes: [
    'instagram_basic',
    'pages_show_list',
    'instagram_manage_comments',
    'instagram_manage_insights',
    'instagram_content_publish',
    'pages_read_engagement'
  ]
};

export default facebookConfig;

import axios from 'axios';
import { facebookConfig } from '../config/facebookConfig.js';
import { supabase } from '../utils/supabase.js';

const GRAPH_BASE_URL = `https://graph.facebook.com/${facebookConfig.apiVersion}`;

export const igService = {
  /**
   * Exchange short-lived token for long-lived token (60 days)
   */
  async getLongLivedToken(shortLivedToken) {
    try {
      const response = await axios.get(`${GRAPH_BASE_URL}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: facebookConfig.appId,
          client_secret: facebookConfig.appSecret,
          fb_exchange_token: shortLivedToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting long-lived token:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get Facebook Pages to find the one linked to Instagram
   */
  async getFacebookPages(accessToken) {
    try {
      const response = await axios.get(`${GRAPH_BASE_URL}/me/accounts`, {
        params: { access_token: accessToken }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching FB pages:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get Instagram Business Account ID from a Page ID
   */
  async getInstagramAccountId(pageId, accessToken) {
    try {
      const response = await axios.get(`${GRAPH_BASE_URL}/${pageId}`, {
        params: {
          fields: 'instagram_business_account',
          access_token: accessToken
        }
      });
      return response.data.instagram_business_account?.id;
    } catch (error) {
      console.error('Error fetching IG account ID:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get Instagram Account Details (followers, media_count, etc.)
   */
  async getAccountDetails(igUserId, accessToken) {
    try {
      const response = await axios.get(`${GRAPH_BASE_URL}/${igUserId}`, {
        params: {
          fields: 'id,username,name,profile_picture_url,followers_count,media_count',
          access_token: accessToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching IG account details:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Fetch Media List
   */
  async getMediaList(igUserId, accessToken) {
    try {
      const response = await axios.get(`${GRAPH_BASE_URL}/${igUserId}/media`, {
        params: {
          fields: 'id,media_type,media_url,permalink,caption,timestamp,like_count,comments_count',
          access_token: accessToken
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching media list:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Fetch Comments for a Media
   */
  async getComments(mediaId, accessToken) {
    try {
      const response = await axios.get(`${GRAPH_BASE_URL}/${mediaId}/comments`, {
        params: {
          fields: 'id,text,username,timestamp,replied',
          access_token: accessToken
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching comments:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Reply to a Comment
   */
  async replyToComment(commentId, text, accessToken) {
    try {
      const response = await axios.post(`${GRAPH_BASE_URL}/${commentId}/replies`, {
        message: text,
        access_token: accessToken
      });
      return response.data;
    } catch (error) {
      console.error('Error replying to comment:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Send Private Reply (DM) to a comment
   */
  async sendPrivateReply(commentId, text, accessToken) {
    try {
      const response = await axios.post(`${GRAPH_BASE_URL}/${commentId}/private_replies`, {
        message: text,
        access_token: accessToken
      });
      return response.data;
    } catch (error) {
      console.error('Error sending private reply:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Business Discovery
   */
  async businessDiscovery(igUserId, targetUsername, accessToken) {
    try {
      const response = await axios.get(`${GRAPH_BASE_URL}/${igUserId}`, {
        params: {
          fields: `business_discovery.username(${targetUsername}){followers_count,media_count}`,
          access_token: accessToken
        }
      });
      return response.data.business_discovery;
    } catch (error) {
      console.error('Business discovery error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Hashtag Search
   */
  async searchHashtag(igUserId, hashtag, accessToken) {
    try {
      // 1. Get Hashtag ID
      const idResponse = await axios.get(`${GRAPH_BASE_URL}/ig_hashtag_search`, {
        params: {
          user_id: igUserId,
          q: hashtag,
          access_token: accessToken
        }
      });
      const hashtagId = idResponse.data.data?.[0]?.id;
      if (!hashtagId) return [];

      // 2. Get Recent Media for Hashtag
      const mediaResponse = await axios.get(`${GRAPH_BASE_URL}/${hashtagId}/recent_media`, {
        params: {
          user_id: igUserId,
          fields: 'id,media_type,media_url,permalink',
          access_token: accessToken
        }
      });
      return mediaResponse.data.data;
    } catch (error) {
      console.error('Hashtag search error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Insights
   */
  async getInsights(igUserId, accessToken) {
    try {
      const response = await axios.get(`${GRAPH_BASE_URL}/${igUserId}/insights`, {
        params: {
          metric: 'impressions,reach,profile_views',
          period: 'day',
          access_token: accessToken
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching insights:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Content Publishing
   */
  async publishMedia(igUserId, mediaUrl, caption, accessToken) {
    try {
      // 1. Create Media Container
      const containerResponse = await axios.post(`${GRAPH_BASE_URL}/${igUserId}/media`, {
        image_url: mediaUrl,
        caption: caption,
        access_token: accessToken
      });
      const creationId = containerResponse.data.id;

      // 2. Publish Container
      const publishResponse = await axios.post(`${GRAPH_BASE_URL}/${igUserId}/media_publish`, {
        creation_id: creationId,
        access_token: accessToken
      });
      return publishResponse.data;
    } catch (error) {
      console.error('Error publishing media:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default igService;

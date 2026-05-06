const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const config = {
  API_URL,
  API_BASE: `${API_URL}/api`,
  SOCKET_URL: API_URL
};

export default config;

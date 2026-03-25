import DOMPurify from 'dompurify';
import Cookies from 'js-cookie';

const TOKEN_KEY = '__plastitaps_secure_session';

export const Security = {
  // Prevent XSS by sanitizing all raw inputs
  sanitizeValues: (data) => {
    const sanitized = {};
    for (const key in data) {
      if (typeof data[key] === 'string') {
        sanitized[key] = DOMPurify.sanitize(data[key]);
      } else {
        sanitized[key] = data[key];
      }
    }
    return sanitized;
  },

  // Simulating an HttpOnly secure token creation from a backend
  simulateLogin: (email, password) => {
    if (email && password.length >= 8) {
      const mockToken = btoa(email + Date.now());
      Cookies.set(TOKEN_KEY, mockToken, { secure: true, sameSite: 'strict', expires: 1 });
      return true;
    }
    return false;
  },

  logout: () => {
    Cookies.remove(TOKEN_KEY);
  },

  isAuthenticated: () => {
    return !!Cookies.get(TOKEN_KEY);
  },
  
  // Obfuscating the business email prevent basic HTML scraper scraping it from bundle directly
  getVentasEndpoint: () => {
    // Base64 decoded to: ventas@plastitaps.com
    return atob('dmVudGFzQHBsYXN0aXRhcHMuY29t');
  }
};

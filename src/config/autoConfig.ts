{/* Налаштування Microsoft 365 */}
{/* SPA (Single Page Application) — односторінкові сайти */}
import type { Configuration, PopupRequest } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    // Значення clientId має відповідати реєстрації SPA в Microsoft Entra.
    clientId: 'f8cdef31-a31e-4b4a-93e4-5f571e91255a',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

export const loginRequest: PopupRequest = {
  // Мінімальний scope для читання профілю /me з Microsoft Graph.
  scopes: ['User.Read'],
};

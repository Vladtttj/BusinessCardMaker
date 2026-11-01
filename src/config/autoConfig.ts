{/* Налаштування Microsoft 365 */}
{/* SPA (Single Page Application) — односторінкові сайти */}
import type { Configuration, PopupRequest } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    // Значення clientId має відповідати реєстрації SPA в Microsoft Entra.
    clientId: 'f8cdef31-a31e-4b4a-93e4-5f571e91255a',
    // This application registration currently supports organizational Microsoft 365 accounts.
    authority: 'https://login.microsoftonline.com/organizations',
    redirectUri: new URL(import.meta.env.BASE_URL, window.location.origin).toString(),
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

export const loginRequest: PopupRequest = {
  // Мінімальний scope для читання профілю /me з Microsoft Graph.
  scopes: ['User.Read'],
};

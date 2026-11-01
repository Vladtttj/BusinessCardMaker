import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../config/autoConfig';
import type { CardData } from '../types/card';
import { normalizeUaPhone } from '../utils/cardFormatting';

{/* Профіль користувача з Microsoft Graph (/me). */}
export interface GraphProfile {
  displayName?: string;
  givenName?: string;
  surname?: string;
  jobTitle?: string;
  mail?: string;
  userPrincipalName?: string;
  businessPhones?: string[];
  mobilePhone?: string;
  officeLocation?: string;
}

export interface SessionUser {
  name: string;
  email: string;
}

let pcaInstance: PublicClientApplication | null = null;

function getPca(): PublicClientApplication {
  // MSAL-клієнт створюється один раз і далі повторно використовується.
  if (!pcaInstance) {
    pcaInstance = new PublicClientApplication(msalConfig);
  }
  return pcaInstance;
}

{/* Повний вхід: ініціалізація MSAL → popup-логін → токен → профіль Graph. */}
export async function loginWithMicrosoft(): Promise<{ user: SessionUser; profile: GraphProfile }> {
  const pca = getPca();
  await pca.initialize();

  const accounts = pca.getAllAccounts();
  let account = accounts[0];

  if (!account) {
    const result = await pca.loginPopup(loginRequest);
    account = result.account;
  }

  let token: string;
  try {
    // Спершу пробуємо непомітне оновлення токена; popup потрібен лише за вимогою MSAL.
    const silent = await pca.acquireTokenSilent({ ...loginRequest, account });
    token = silent.accessToken;
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      const interactive = await pca.acquireTokenPopup({ ...loginRequest, account });
      token = interactive.accessToken;
    } else {
      throw err;
    }
  }

  const res = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Graph /me повернув ${res.status}`);
  const profile: GraphProfile = await res.json();

  const name = profile.displayName || `${profile.givenName ?? ''} ${profile.surname ?? ''}`.trim();
  const email = profile.mail || profile.userPrincipalName || '';
  return { user: { name, email }, profile };
}

export async function logoutMicrosoft(): Promise<void> {
  const pca = getPca();
  const accounts = pca.getAllAccounts();
  if (accounts[0]) {
    await pca.logoutPopup({ account: accounts[0] });
  }
}

{/* Перетворює профіль Graph на попередньо заповнені дані візитки. */}
export function profileToCardData(profile: GraphProfile, base: CardData): CardData {
  const displayName = profile.displayName ?? '';
  const displayNameParts = displayName.trim().split(/\s+/).filter(Boolean);
  const firstName = profile.givenName || displayNameParts[0] || base.firstName;
  const lastName = profile.surname || displayNameParts.slice(1).join(' ') || base.lastName;
  const phone = profile.mobilePhone || profile.businessPhones?.[0] || base.phone;
  return {
    // Профіль може не мати всіх полів, тому відсутні значення зберігаються з попередньої форми.
    ...base,
    firstName: firstName.toLocaleUpperCase('uk-UA'),
    lastName: lastName.toLocaleUpperCase('uk-UA'),
    firstNameEn: (translit(firstName) || base.firstNameEn).toLocaleUpperCase('en-US'),
    lastNameEn: (translit(lastName) || base.lastNameEn).toLocaleUpperCase('en-US'),
    position: profile.jobTitle ?? base.position,
    email: profile.mail || profile.userPrincipalName || base.email,
    phone: normalizeUaPhone(phone) || base.phone,
    address: profile.officeLocation ?? base.address,
    addressEn: profile.officeLocation ? translit(profile.officeLocation) : base.addressEn,
  };
}

{/* Проста транслітерація UA→EN для англійської сторони двомовної візитки. */}
const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh',
  з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', "'": '',
};

export function translit(input: string): string {
  return input
    .split('')
    .map((ch) => {
      const lower = ch.toLowerCase();
      const mapped = TRANSLIT[lower] ?? ch;
      return ch === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
    })
    .join('');
}

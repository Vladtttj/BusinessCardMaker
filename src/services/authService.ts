import { PublicClientApplication } from '@azure/msal-browser';
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
let initialization: Promise<void> | null = null;
let redirectHandling: Promise<{ user: SessionUser; profile: GraphProfile } | null> | null = null;

function getPca(): PublicClientApplication {
  if (!pcaInstance) {
    pcaInstance = new PublicClientApplication(msalConfig);
  }
  return pcaInstance;
}

async function initializePca(): Promise<PublicClientApplication> {
  const pca = getPca();
  initialization ??= pca.initialize();
  await initialization;
  return pca;
}

async function getGraphProfile(accessToken: string): Promise<{ user: SessionUser; profile: GraphProfile }> {
  const res = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Graph /me повернув ${res.status}`);
  const profile: GraphProfile = await res.json();

  const name = profile.displayName || `${profile.givenName ?? ''} ${profile.surname ?? ''}`.trim();
  const email = profile.mail || profile.userPrincipalName || '';
  return { user: { name, email }, profile };
}

export async function loginWithMicrosoft(): Promise<void> {
  const pca = await initializePca();
  await pca.loginRedirect(loginRequest);
}

export async function completeMicrosoftRedirectLogin(): Promise<{ user: SessionUser; profile: GraphProfile } | null> {
  if (redirectHandling) return redirectHandling;
  redirectHandling = completeMicrosoftRedirectLoginOnce();
  return redirectHandling;
}

async function completeMicrosoftRedirectLoginOnce(): Promise<{ user: SessionUser; profile: GraphProfile } | null> {
  const pca = await initializePca();
  const result = await pca.handleRedirectPromise();
  const account = result?.account ?? pca.getActiveAccount() ?? pca.getAllAccounts()[0];
  if (!account) return null;

  pca.setActiveAccount(account);
  const tokenResult = result?.accessToken
    ? result
    : await pca.acquireTokenSilent({ ...loginRequest, account });
  return getGraphProfile(tokenResult.accessToken);
}

export async function logoutMicrosoft(): Promise<void> {
  const pca = await initializePca();
  const accounts = pca.getAllAccounts();
  if (accounts[0]) {
    await pca.logoutRedirect({ account: accounts[0] });
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

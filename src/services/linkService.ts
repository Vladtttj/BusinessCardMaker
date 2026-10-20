{/* Генерація 48-годинного посилання */}
export interface TokenPayload {
  createdAt: number;
  nonce: string;
}

export const create48hToken = (): string => {
  const payload: TokenPayload = {
    createdAt: Date.now(),
    nonce: Math.random().toString(36).substring(2, 9),
  };
  const jsonString = JSON.stringify(payload);
  // URL-safe Base64 дає змогу передати payload у query-параметрі без спецсимволів.
  return btoa(jsonString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const validate48hToken = (token: string): boolean => {
  try {
    // Відновлюємо Base64 та перевіряємо, що час створення лежить у межах останніх 48 годин.
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const payload: TokenPayload = JSON.parse(atob(base64));
    if (!payload.createdAt) return false;
    const ageInHours = (Date.now() - payload.createdAt) / (1000 * 60 * 60);
    return ageInHours >= 0 && ageInHours <= 48;
  } catch {
    return false;
  }
};

{/* Скільки годин лишилось до закінчення дії токена. */}
export const tokenRemainingHours = (token: string): number => {
  try {
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const payload: TokenPayload = JSON.parse(atob(base64));
    const ageInHours = (Date.now() - payload.createdAt) / (1000 * 60 * 60);
    return 48 - ageInHours;
  } catch {
    return -1;
  }
};

{/* Дістає токен доступу з query-параметра ?access= поточного URL. */}
export const getAccessFromUrl = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('access');
};

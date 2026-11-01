{/* Структура даних візитки. Поля EN використовуються для мов EN та BILINGUAL */}
export interface CardData {
  // Паралельні UA/EN значення зберігаються окремо для двомовного макета.
  firstName: string;
  lastName: string;
  firstNameEn: string;
  lastNameEn: string;
  position: string;
  positionEn: string;
  businessUnit: string;
  businessUnitEn: string;
  phone: string;
  email: string;
  address: string;
  addressEn: string;
}

{/* Режим мови: українська, англійська або комплект сторін українською та англійською */}
export type LanguageMode = 'UA' | 'EN' | 'BILINGUAL';

{/* Тип візитки: магазин/офіс, персональна, підрозділ */}
export type CardMode = 'Store' | 'Personal' | 'Business';

export type Step = 1 | 2 | 3 | 4 | 5;

{/* Спосіб доступу, підтверджений на кроці 1 */}
export type AccessMode = 'microsoft' | 'link' | null;

export const emptyCardData = (): CardData => ({
  firstName: '',
  lastName: '',
  firstNameEn: '',
  lastNameEn: '',
  position: '',
  positionEn: '',
  businessUnit: '',
  businessUnitEn: '',
  phone: '',
  email: '',
  address: '',
  addressEn: '',
});

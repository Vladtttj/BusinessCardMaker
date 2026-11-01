import type { CardMode, LanguageMode } from '../types/card';

{/* ── Бренд PROMAVTOMATYKA ───────────────────────────────────────── */}
export const BRAND = {
  name: 'PROMAVTOMATYKA',
  accent: '#ff5500',
  accentDark: '#d94800',
  ink: '#141118',
  muted: '#6b6375',
};

{/* Розмір візитки у міліметрах: trim 90×50, як у фірмових макетах. */}
export const CARD_MM = { w: 90, h: 50 };
{/* Bleed (припуск під обріз) 2 мм з кожного боку → сторінка PDF 94×54 мм. */}
export const BLEED_MM = 2;
export const PAGE_MM = { w: CARD_MM.w + BLEED_MM * 2, h: CARD_MM.h + BLEED_MM * 2 };
{/* Екранне превʼю у пікселях — той самий пропорційний вигляд, що й PDF. */}
export const CARD_PX = { w: 396, h: 220 };

{/* Фіксовані типографічні правила бренду. */}
export interface TypeRule {
  weight: number;
  ttf: string;
}

export const TYPE = {
  name: { weight: 700, ttf: `${import.meta.env.BASE_URL}fonts/Montserrat-Bold.ttf` },
  data: { weight: 500, ttf: `${import.meta.env.BASE_URL}fonts/Montserrat-Medium.ttf` },
  logo: { weight: 400, ttf: `${import.meta.env.BASE_URL}fonts/Montserrat-Regular.ttf` },
} as const satisfies Record<string, TypeRule>;

export type TypeRole = keyof typeof TYPE;

{/* ── Мовні словники (UA / EN) ───────────────────────────────────── */}
type Lang = 'UA' | 'EN';

export interface Dict {
  firstName: string;
  lastName: string;
  position: string;
  businessUnit: string;
  phone: string;
  email: string;
  address: string;
  ph: {
    firstName: string;
    lastName: string;
    position: string;
    businessUnit: string;
    phone: string;
    email: string;
    address: string;
  };
}

export const DICT: Record<Lang, Dict> = {
  UA: {
    firstName: "Ім'я",
    lastName: 'Прізвище',
    position: 'Посада',
    businessUnit: 'Підрозділ',
    phone: 'Телефон',
    email: 'E-mail',
    address: 'Адреса',
    ph: {
      firstName: 'Іван',
      lastName: 'Петренко',
      position: 'Менеджер з продажу',
      businessUnit: 'Автоматизація',
      phone: '+380 (67) 123 4567',
      email: 'i.petrenko@promavtomatyka.ua',
      address: 'м. Вінниця, вул. Пример, 1',
    },
  },
  EN: {
    firstName: 'First name',
    lastName: 'Last name',
    position: 'Job title',
    businessUnit: 'Business unit',
    phone: 'Phone',
    email: 'E-mail',
    address: 'Address',
    ph: {
      firstName: 'Ivan',
      lastName: 'Petrenko',
      position: 'Sales Manager',
      businessUnit: 'Automation',
      phone: '+380 (67) 123 4567',
      email: 'i.petrenko@promavtomatyka.ua',
      address: '1 Pryklad St., Vinnytsia',
    },
  },
};

export const LANG_LABEL: Record<LanguageMode, string> = {
  UA: 'Українська',
  EN: 'English',
  BILINGUAL: 'UA + EN',
};

{/* ── Шаблони візиток ────────────────────────────────────────────── */}
export interface TemplateDef {
  id: CardMode;
  title: string;
  desc: string;
  variant: 'store' | 'personal' | 'business';
  accent: string;
  bg: string;
  dark: boolean;
  show: {
    // Ці прапорці визначають, які поля відображати і в прев’ю, і в експорті.
    name: boolean;
    position: boolean;
    businessUnit: boolean;
    address: boolean;
  };
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'Store',
    title: 'Магазин / офіс',
    desc: 'ПІБ і контакти спереду; назва підрозділу помаранчевим з обох боків.',
    variant: 'store',
    accent: '#ff5500',
    bg: '#141118',
    dark: true,
    show: { name: true, position: false, businessUnit: true, address: true },
  },
  {
    id: 'Personal',
    title: 'Персональна',
    desc: 'Спільний фірмовий макет з ПІБ, посадою та особистими контактами.',
    variant: 'personal',
    accent: '#ff5500',
    bg: '#ffffff',
    dark: false,
    show: { name: true, position: true, businessUnit: false, address: false },
  },
  {
    id: 'Business',
    title: 'Business Unit',
    desc: 'Спільний фірмовий макет з ім’ям та адресою підрозділу.',
    variant: 'business',
    accent: '#ff5500',
    bg: '#ffffff',
    dark: false,
    show: { name: true, position: false, businessUnit: false, address: true },
  },
];

export const templateById = (id: CardMode): TemplateDef =>
  TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[1];

{/* ── Список підрозділів (Business Unit) з назвами UA/EN ─────────── */}
export interface BusinessUnit {
  id: string;
  ua: string;
  en: string;
}

export const BUSINESS_UNITS: BusinessUnit[] = [
  { id: 'automation', ua: 'Автоматизація', en: 'Automation' },
  { id: 'electrical', ua: 'Електромонтаж', en: 'Electrical Installation' },
  { id: 'service', ua: 'Сервіс та обслуговування', en: 'Service & Maintenance' },
  { id: 'sales', ua: 'Відділ продажу', en: 'Sales Department' },
];

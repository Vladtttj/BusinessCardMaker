import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { CardData, CardMode, LanguageMode } from '../types/card';
import { BRAND, TYPE, templateById } from '../config/design';
import { translit } from './authService';
import { formatCardName, formatUaPhone } from '../utils/cardFormatting';

const MM = 72 / 25.4;
const CARD_TEXT_SIZE = 8;
// Позиції нижче задані в міліметрах від верхнього лівого кута відповідного шаблону.
const PERSONAL_TEMPLATE_URL = `${import.meta.env.BASE_URL}templates/personal_ua.pdf`;
const BUSINESS_TEMPLATE_URL = `${import.meta.env.BASE_URL}templates/ua-en-businessUnit.pdf`;

const BUSINESS_LAYOUT = {
  name: { x: 42.82, top: 8.89, width: 37.126, height: 3.2 },
  contacts: { x: 42.754, top: 15.474, width: 32.456, height: 6.418 },
  address: { x: 42.754, top: 32.169, width: 42.246, height: 9.377 },
};

const PERSONAL_UA_LAYOUT = {
  x: 41,
  width: 46,
  name: { top: 10, height: 8 },
  position: { top: 19, height: 8 },
  phone: { top: 29, height: 5 },
  email: { top: 35, height: 5 },
  address: { top: 38.5, height: 9 },
};

const STORE_FRONT_UNIT_LAYOUT = {
  x: 6,
  top: 35,
  width: 35,
  height: 14,
};

const BILINGUAL_STORE_UNIT_LAYOUT = {
  x: 42.754,
  top: 25,
  width: 42.246,
  height: 6.5,
};

const STORE_BACK_UNIT_LAYOUT = {
  x: 6,
  top: 38.5,
  width: 47,
  height: 11.5,
};

const STORE_BACK_ADDRESS_LAYOUT = {
  x: 6,
  top: 35,
  width: 47,
  height: 3,
};

type Side = 'UA' | 'EN';

function hex(value: string) {
  const v = value.replace('#', '');
  return rgb(
    parseInt(v.slice(0, 2), 16) / 255,
    parseInt(v.slice(2, 4), 16) / 255,
    parseInt(v.slice(4, 6), 16) / 255,
  );
}

const fontCache = new Map<string, Uint8Array>();
async function loadFontBytes(path: string): Promise<Uint8Array> {
  const cached = fontCache.get(path);
  if (cached) return cached;
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Не вдалося завантажити шрифт ${path}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  fontCache.set(path, bytes);
  return bytes;
}

function loc(lang: Side, ua: string, en: string): string {
  const primary = lang === 'EN' ? en : ua;
  const fallback = lang === 'EN' ? ua : en;
  return (primary || fallback).trim();
}

interface TextArea {
  x: number;
  top: number;
  width: number;
  height: number;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      if (line) lines.push(line);
      line = word;
      continue;
    }
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawTemplateText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  area: TextArea,
  color: ReturnType<typeof rgb>,
  multiline = false,
  label = 'Поле',
) {
  // pdf-lib використовує точки та відлік Y знизу, тому координати макета конвертуються тут.
  const x = area.x * MM;
  const top = area.top * MM;
  const maxWidth = area.width * MM;
  const maxHeight = area.height * MM;
  const size = CARD_TEXT_SIZE;
  const lines = multiline ? wrapText(text, font, size, maxWidth) : [text.trim()];
  const widthFits = lines.every((line) => font.widthOfTextAtSize(line, size) <= maxWidth);
  const lineHeight = multiline ? size * 1.1 : size;
  const heightFits = lines.length * lineHeight <= maxHeight;
  if (!widthFits || !heightFits) {
    throw new Error(`${label}: текст не вміщується за фіксованого розміру шрифту. Скоротіть його.`);
  }

  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: page.getHeight() - top - size - index * size * 1.1,
      size,
      font,
      color,
    });
  });
}

function drawPersonalLine(
  page: PDFPage,
  text: string,
  font: PDFFont,
  area: { top: number; height: number },
  color: ReturnType<typeof rgb>,
  label: string,
  multiline = false,
) {
  const value = text.trim();
  if (!value) return;
  drawTemplateText(
    page,
    value,
    font,
    {
      x: PERSONAL_UA_LAYOUT.x,
      top: area.top,
      width: PERSONAL_UA_LAYOUT.width,
      height: area.height,
    },
    color,
    multiline,
    label,
  );
}

function drawPersonalFront(
  page: PDFPage,
  template: CardMode,
  language: Side,
  data: CardData,
  nameFont: PDFFont,
  dataFont: PDFFont,
) {
  const t = templateById(template);
  const name = formatCardName(
    loc(language, data.firstName, data.firstNameEn),
    loc(language, data.lastName, data.lastNameEn),
    language === 'UA' ? 'uk-UA' : 'en-US',
  );
  const position = loc(language, data.position, data.positionEn);
  const address = loc(language, data.address, data.addressEn);
  const white = rgb(1, 1, 1);

  if (t.show.name) {
    drawPersonalLine(page, name, nameFont, PERSONAL_UA_LAYOUT.name, hex(BRAND.accent), language === 'UA' ? 'Ім’я' : 'Full name');
  }
  if (t.show.position) {
    drawPersonalLine(page, position, dataFont, PERSONAL_UA_LAYOUT.position, white, language === 'UA' ? 'Посада' : 'Job title');
  }
  const phone = formatUaPhone(data.phone);
  drawPersonalLine(page, phone, dataFont, PERSONAL_UA_LAYOUT.phone, white, 'Телефон');
  if (data.email.trim()) {
    drawPersonalLine(page, data.email, dataFont, PERSONAL_UA_LAYOUT.email, white, 'E-mail');
  }
  if (t.show.address) {
    drawPersonalLine(page, address, dataFont, PERSONAL_UA_LAYOUT.address, white, language === 'UA' ? 'Адреса' : 'Address', true);
  }
  if (template === 'Store') {
    const unit = loc(language, data.businessUnit, data.businessUnitEn).toLocaleUpperCase();
    if (unit) {
      drawTemplateText(
        page,
        unit,
        nameFont,
        STORE_FRONT_UNIT_LAYOUT,
        hex(BRAND.accent),
        true,
        language === 'UA' ? 'Підрозділ' : 'Business unit',
      );
    }
  }
}

function drawStoreBackUnit(page: PDFPage, unit: string, font: PDFFont, address = '') {
  if (address.trim()) {
    drawTemplateText(
      page,
      address,
      font,
      STORE_BACK_ADDRESS_LAYOUT,
      rgb(1, 1, 1),
      false,
      'Адреса на звороті',
    );
  }
  const value = unit.trim().toLocaleUpperCase();
  if (!value) return;
  drawTemplateText(
    page,
    value,
    font,
    STORE_BACK_UNIT_LAYOUT,
    hex(BRAND.accent),
    true,
    'Підрозділ',
  );
}

async function generateBilingualPdf(templateMode: CardMode, data: CardData): Promise<Uint8Array> {
  const response = await fetch(BUSINESS_TEMPLATE_URL);
  if (!response.ok) {
    throw new Error(`Не вдалося завантажити PDF-шаблон (${response.status}): ${BUSINESS_TEMPLATE_URL}`);
  }

  const template = await PDFDocument.load(await response.arrayBuffer());
  if (template.getPageCount() < 3) {
    throw new Error('У двомовному PDF-зразку мають бути українська та англійська сторінки.');
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const nameFont = await pdfDoc.embedFont(await loadFontBytes(TYPE.name.ttf), { subset: true });
  const dataFont = await pdfDoc.embedFont(await loadFontBytes(TYPE.data.ttf), { subset: true });
  const t = templateById(templateMode);

  const pages = [
    // Зразок уже містить фон та QR на цих сторінках; беремо лише UA та EN.
    { index: 0, side: 'UA' },
    { index: 2, side: 'EN' },
  ] as const;

  for (const { index, side } of pages) {
    const [page] = await pdfDoc.copyPages(template, [index]);
    pdfDoc.addPage(page);

    const unit = loc(side, data.businessUnit, data.businessUnitEn);
    const name = formatCardName(
      loc(side, data.firstName, data.firstNameEn),
      loc(side, data.lastName, data.lastNameEn),
      side === 'UA' ? 'uk-UA' : 'en-US',
    );
    const position = loc(side, data.position, data.positionEn);
    const address = loc(side, data.address, data.addressEn);

    if (t.show.name && name) {
      drawTemplateText(page, name, nameFont, BUSINESS_LAYOUT.name, hex(BRAND.accent), false, side === 'UA' ? 'Ім’я' : 'Full name');
    }
    if (t.show.position && position) {
      drawTemplateText(page, position, dataFont, { ...BUSINESS_LAYOUT.name, top: 12.5, height: 5 }, rgb(1, 1, 1), false, side === 'UA' ? 'Посада' : 'Job title');
    }

    const contacts = [formatUaPhone(data.phone), data.email.trim()].filter(Boolean);
    contacts.forEach((contact, contactIndex) => {
      drawTemplateText(
        page,
        contact,
        dataFont,
        { ...BUSINESS_LAYOUT.contacts, top: BUSINESS_LAYOUT.contacts.top + contactIndex * 3.175 },
        rgb(1, 1, 1),
        false,
        contactIndex === 0 ? 'Телефон' : 'E-mail',
      );
    });

    if (t.show.address && address) {
      drawTemplateText(page, address, dataFont, BUSINESS_LAYOUT.address, rgb(1, 1, 1), true, side === 'UA' ? 'Адреса' : 'Address');
    }
    if (templateMode === 'Store' && unit) {
      drawTemplateText(
        page,
        unit.toLocaleUpperCase(),
        nameFont,
        BILINGUAL_STORE_UNIT_LAYOUT,
        hex(BRAND.accent),
        true,
        side === 'UA' ? 'Підрозділ' : 'Business unit',
      );
    }
  }

  pdfDoc.setTitle(buildFileName({ template: templateMode, language: 'BILINGUAL', data }).replace('.pdf', ''));
  pdfDoc.setAuthor(BRAND.name);
  pdfDoc.setCreator(`${BRAND.name} Card Maker`);
  return pdfDoc.save();
}

async function generateTemplatePdf(templateMode: CardMode, language: LanguageMode, data: CardData): Promise<Uint8Array> {
  const response = await fetch(PERSONAL_TEMPLATE_URL);
  if (!response.ok) {
    throw new Error(`Не вдалося завантажити PDF-шаблон (${response.status}): ${PERSONAL_TEMPLATE_URL}`);
  }

  const template = await PDFDocument.load(await response.arrayBuffer());
  if (template.getPageCount() < 2) {
    throw new Error('У PDF-шаблоні Personal UA мають бути лицьова та зворотна сторони.');
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const nameFont = await pdfDoc.embedFont(await loadFontBytes(TYPE.name.ttf), { subset: true });
  const dataFont = await pdfDoc.embedFont(await loadFontBytes(TYPE.data.ttf), { subset: true });
  const storeBilingual = templateMode === 'Store' && language === 'BILINGUAL';
  // Для магазину двомовний режим — UA лице + EN зворот; інші шаблони мають дві мовні лицьові сторони.
  const sides: Side[] = language === 'BILINGUAL' ? (storeBilingual ? ['UA'] : ['UA', 'EN']) : [language];
  for (const side of sides) {
    const [front] = await pdfDoc.copyPages(template, [0]);
    pdfDoc.addPage(front);
    drawPersonalFront(front, templateMode, side, data, nameFont, dataFont);
  }
  if (language !== 'BILINGUAL' || storeBilingual) {
    const [back] = await pdfDoc.copyPages(template, [1]);
    pdfDoc.addPage(back);
    if (templateMode === 'Store') {
      const backLanguage: Side = language === 'BILINGUAL' ? 'EN' : language;
      drawStoreBackUnit(
        back,
        loc(backLanguage, data.businessUnit, data.businessUnitEn),
        nameFont,
        storeBilingual ? loc(backLanguage, data.address, data.addressEn) : '',
      );
    }
  }

  pdfDoc.setTitle(buildFileName({ template: templateMode, language, data }).replace('.pdf', ''));
  pdfDoc.setAuthor(BRAND.name);
  pdfDoc.setCreator(`${BRAND.name} Card Maker`);
  return pdfDoc.save();
}

export interface PdfParams {
  template: CardMode;
  language: LanguageMode;
  data: CardData;
}

export function buildFileName({ template, language, data }: PdfParams): string {
  const langSuffix = language === 'BILINGUAL' ? 'UA-EN' : language;
  const slug = (value: string) =>
    (translit(value).trim().toLocaleLowerCase('en-US').replace(/\s+/g, '_').replace(/[^\w-]/g, '') || 'card');
  if (template === 'Store') {
    const place = slug(data.businessUnit || 'store');
    return `${place}_store_card_${langSuffix}.pdf`;
  }
  const who = slug(
    [data.firstName, data.lastName].filter(Boolean).join(' ')
      || [data.firstNameEn, data.lastNameEn].filter(Boolean).join(' '),
  );
  return `${who}_card_${langSuffix}.pdf`;
}

export async function generateCardPdf(params: PdfParams): Promise<Uint8Array> {
  const { template, language, data } = params;
  // Для BILINGUAL беремо дві сторінки з мовного зразка; для решти — personal_ua.pdf.
  if (language === 'BILINGUAL') {
    return generateBilingualPdf(template, data);
  }
  return generateTemplatePdf(template, language, data);
}

export async function downloadCardPdf(params: PdfParams): Promise<string> {
  const bytes = await generateCardPdf(params);
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = buildFileName(params);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return anchor.download;
}

export async function createPdfPreviewUrl(params: PdfParams): Promise<string> {
  const bytes = await generateCardPdf(params);
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

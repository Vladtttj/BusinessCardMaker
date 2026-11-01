import React from 'react';
import type { CardData, CardMode, LanguageMode } from '../../types/card';
import { DICT, templateById, LANG_LABEL } from '../../config/design';
import { PdfPagePreview } from '../Preview/PdfPagePreview';
import { useCardPdfPreview } from '../../hooks/useCardPdfPreview';
import { formatUaPhone, normalizeUaPhone } from '../../utils/cardFormatting';

interface Props {
  template: CardMode;
  language: LanguageMode;
  data: CardData;
  setData: React.Dispatch<React.SetStateAction<CardData>>;
  onNext: () => void;
  onBack: () => void;
}

const Field: React.FC<{
  label: string;
  name: keyof CardData;
  value: string;
  placeholder?: string;
  onChange: (name: keyof CardData, value: string) => void;
  full?: boolean;
}> = ({ label, name, value, placeholder, onChange, full }) => (
  <div className={`field ${full ? 'full' : ''}`}>
    <label>{label}</label>
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(name, e.target.value)}
    />
  </div>
);

// Список доступних адрес
const option_address = [
  { id: '1', label: 'вул. Хмельницьке шосе, 145, м. Вінниця, 21000, Україна' },
  { id: '2', label: 'вул. Дмитра Крамара, 9/4, м. Хмельницький, 29015, Україна' },
  { id: '3', label: 'вул. Дорогожицька, 3, буд. 10, м. Київ, 04119, Україна' },
  { id: '4', label: 'вул. Ярослава Мудрого, 68, м. Дніпро, Україна' },
  { id: '5', label: 'вул. Дорожна, 58В, с. Пасіки-Зубрицькі, Львівський р-н, 81137, Україна' },
];

export const Step4Form: React.FC<Props> = ({ template, language, data, setData, onNext, onBack }) => {
  const t = templateById(template);
  
  // Двомовний режим показує два набори мовних полів; телефон та e-mail спільні.
  const showUa = language === 'UA' || language === 'BILINGUAL';
  const showEn = language === 'EN' || language === 'BILINGUAL';

  const onChange = (name: keyof CardData, value: string) =>
    setData((prev) => ({
      ...prev,
      [name]: name === 'phone'
        ? normalizeUaPhone(value)
        : name === 'firstName' || name === 'lastName'
          ? value.toLocaleUpperCase('uk-UA')
          : name === 'firstNameEn' || name === 'lastNameEn'
            ? value.toLocaleUpperCase('en-US')
            : value,
    }));
  const pdfParams = { template, language, data };
  const { pdfUrl, error: previewError } = useCardPdfPreview(pdfParams);

  // Якщо адреса порожня при першому завантаженні, можна встановити першу за замовчуванням
  React.useEffect(() => {
    if (!data.address && option_address.length > 0) {
      onChange('address', option_address[0].label);
    }
  }, []);

  // Перевірка переповнення
  const warnings: string[] = [];
  const check = (label: string, v: string, max: number) => {
    if (v.trim().length > max) {
      warnings.push(`${label}: шрифт буде зменшено для вміщення тексту; якщо поле все ще задовге, скоротіть його.`);
    }
  };
  
  if (t.show.name && showUa) {
    check("Ім'я", data.firstName, 20);
    check('Прізвище', data.lastName, 24);
  }
  if (t.show.name && showEn) {
    check('First name', data.firstNameEn, 20);
    check('Last name', data.lastNameEn, 24);
  }
  if (t.show.position && showUa) check('Посада', data.position, 34);
  if (t.show.position && showEn) check('Job title', data.positionEn, 36);
  if ((t.show.businessUnit || template === 'Store') && showUa) check('Підрозділ', data.businessUnit, 38);
  if ((t.show.businessUnit || template === 'Store') && showEn) check('Business unit', data.businessUnitEn, 40);
  if ((t.show.address || (template === 'Store' && language === 'BILINGUAL')) && showUa) {
    check('Адреса', data.address, 44);
  }
  if ((t.show.address || (template === 'Store' && language === 'BILINGUAL')) && showEn) {
    check('Address', data.addressEn, 46);
  }
  check('Телефон', data.phone, 24);
  check('E-mail', data.email, 40);
  
  return (
    <div className="editor-grid">
      {/* ── Ліва колонка: форма ── */}
      <div className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Конструктор</h2>
          <p className="panel-sub">
            Шаблон: <b>{t.title}</b> · Мова: <b>{LANG_LABEL[language]}</b>. Зміни одразу
            видно на превʼю праворуч.
          </p>
        </div>

        {showUa && (
          <>
            {language === 'BILINGUAL' && <div className="choice-flag" style={{ margin: '6px 0 10px' }}>Сторона UA</div>}
            <div className="form-grid">
              {t.show.name && (
                <>
                  <Field label={DICT.UA.firstName} name="firstName" value={data.firstName} placeholder={DICT.UA.ph.firstName} onChange={onChange} />
                  <Field label={DICT.UA.lastName} name="lastName" value={data.lastName} placeholder={DICT.UA.ph.lastName} onChange={onChange} />
                </>
              )}
              {t.show.position && (
                <Field label={DICT.UA.position} name="position" value={data.position} placeholder={DICT.UA.ph.position} onChange={onChange} full />
              )}
              {t.show.businessUnit && (
                <Field label={DICT.UA.businessUnit} name="businessUnit" value={data.businessUnit} placeholder={DICT.UA.ph.businessUnit} onChange={onChange} full />
              )}
              
              {/* Випадаючий список для вибору адреси (UA) */}
              {t.show.address && (
                <div className="field full">
                  <label htmlFor="address-select">{DICT.UA.address}</label>
                  <select 
                    id="address-select" 
                    value={data.address} 
                    onChange={(e) => onChange('address', e.target.value)}
                  >
                    {option_address.map((option) => (
                      <option key={option.id} value={option.label}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </>
        )}

        {showEn && (
          <>
            {language === 'BILINGUAL' && <div className="choice-flag" style={{ margin: '14px 0 10px' }}>Сторона EN</div>}
            <div className="form-grid">
              {t.show.name && (
                <>
                  <Field label={DICT.EN.firstName} name="firstNameEn" value={data.firstNameEn} placeholder={DICT.EN.ph.firstName} onChange={onChange} />
                  <Field label={DICT.EN.lastName} name="lastNameEn" value={data.lastNameEn} placeholder={DICT.EN.ph.lastName} onChange={onChange} />
                </>
              )}
              {t.show.position && (
                <Field label={DICT.EN.position} name="positionEn" value={data.positionEn} placeholder={DICT.EN.ph.position} onChange={onChange} full />
              )}
              {t.show.businessUnit && (
                <Field label={DICT.EN.businessUnit} name="businessUnitEn" value={data.businessUnitEn} placeholder={DICT.EN.ph.businessUnit} onChange={onChange} full />
              )}
              {t.show.address && (
                <Field label={DICT.EN.address} name="addressEn" value={data.addressEn} placeholder={DICT.EN.ph.address} onChange={onChange} full />
              )}
            </div>
          </>
        )}

        <div className="form-grid" style={{ marginTop: 14 }}>
          <Field
            label={DICT.UA.phone}
            name="phone"
            value={formatUaPhone(data.phone)}
            placeholder="+380 (__) ___ ____"
            onChange={onChange}
          />
          <Field label={DICT.UA.email} name="email" value={data.email} placeholder={DICT.UA.ph.email} onChange={onChange} />
        </div>

        {warnings.length > 0 && (
          <div className="alert warn" style={{ marginTop: 16 }}>
            {warnings.map((w) => <div key={w}>{w}</div>)}
          </div>
        )}

        <div className="btn-row between">
          <button className="btn btn-ghost" onClick={onBack}>← Назад</button>
          <button className="btn btn-primary" onClick={onNext}>Далі: експорт PDF →</button>
        </div>
      </div>

      {/* ── Права колонка: live preview ── */}
      <div className="preview-wrap">
        <h3>Live Preview · 100%</h3>
        {pdfUrl ? (
          <>
            <div className="side-label">{language === 'BILINGUAL' ? 'Сторона (UA)' : `Лицьова сторона (${language})`}</div>
            <PdfPagePreview pdfUrl={pdfUrl} pageNumber={1} title="Перша сторона PDF-зразка" />
            <div className="side-label">{language === 'BILINGUAL' ? 'Сторона (EN)' : 'Зворотна сторона'}</div>
            <PdfPagePreview pdfUrl={pdfUrl} pageNumber={2} title="Друга сторона PDF-зразка" />
          </>
        ) : previewError ? (
          <div className="alert error">Не вдалося створити прев’ю PDF: {previewError}</div>
        ) : (
          <>
            <div className="side-label">Готуємо прев’ю PDF…</div>
          </>
        )}
      </div>
    </div>
  );
};
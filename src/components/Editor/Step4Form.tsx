import React from 'react';
import type { CardData, CardMode, LanguageMode } from '../../types/card';
import { DICT, templateById, LANG_LABEL } from '../../config/design';
import { BusinessCard, BusinessCardBack } from '../BusinessCard';

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
  // Контрольоване поле: його значення завжди береться зі спільного стану App.
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

export const Step4Form: React.FC<Props> = ({ template, language, data, setData, onNext, onBack }) => {
  const t = templateById(template);
  // Двомовний режим показує два набори мовних полів; телефон та e-mail спільні.
  const showUa = language === 'UA' || language === 'BILINGUAL';
  const showEn = language === 'EN' || language === 'BILINGUAL';

  const onChange = (name: keyof CardData, value: string) =>
    setData((prev) => ({ ...prev, [name]: value }));

  // Попередження лише підказують про довгі дані; фактичне вміщення забезпечує підгонка тексту.
  {/* Проста перевірка переповнення: дуже довгі значення можуть не влізти на картку. */}
  const warnings: string[] = [];
  const check = (label: string, v: string, max: number) => {
    if (v.trim().length > max) {
      warnings.push(`${label}: шрифт буде зменшено для вміщення тексту; якщо поле все ще задовге, скоротіть його.`);
    }
  };
  if (t.show.name && showUa) check('ПІБ', data.fullName, 30);
  if (t.show.name && showEn) check('Full name', data.fullNameEn, 32);
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
                <Field label={DICT.UA.fullName} name="fullName" value={data.fullName} placeholder={DICT.UA.ph.fullName} onChange={onChange} full />
              )}
              {t.show.position && (
                <Field label={DICT.UA.position} name="position" value={data.position} placeholder={DICT.UA.ph.position} onChange={onChange} full />
              )}
              {t.show.businessUnit && (
                <Field label={DICT.UA.businessUnit} name="businessUnit" value={data.businessUnit} placeholder={DICT.UA.ph.businessUnit} onChange={onChange} full />
              )}
              {t.show.address && (
                <Field label={DICT.UA.address} name="address" value={data.address} placeholder={DICT.UA.ph.address} onChange={onChange} full />
              )}
            </div>
          </>
        )}

        {showEn && (
          <>
            {language === 'BILINGUAL' && <div className="choice-flag" style={{ margin: '14px 0 10px' }}>Сторона EN</div>}
            <div className="form-grid">
              {t.show.name && (
                <Field label={DICT.EN.fullName} name="fullNameEn" value={data.fullNameEn} placeholder={DICT.EN.ph.fullName} onChange={onChange} full />
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
          <Field label={DICT.UA.phone} name="phone" value={data.phone} placeholder={DICT.UA.ph.phone} onChange={onChange} />
          <Field label={DICT.UA.email} name="email" value={data.email} placeholder={DICT.UA.ph.email} onChange={onChange} />
        </div>

        {warnings.length > 0 && (
          <div className="alert warn" style={{ marginTop: 16 }}>
            {warnings.map((w) => <div key={w}>• {w}</div>)}
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
        {/* Порядок і мова цих чотирьох карток відповідають порядку сторін PDF. */}
        {language === 'BILINGUAL' ? (
          <>
            <div className="side-label">Лицьова сторона (UA)</div>
            <BusinessCard template={template} language="UA" data={data} bilingualTemplate />
            <div className="side-label">Зворотна сторона (UA)</div>
            <BusinessCardBack template={template} language="UA" data={data} bilingualTemplate />
            <div className="side-label">Лицьова сторона (EN)</div>
            <BusinessCard template={template} language="EN" data={data} bilingualTemplate />
            <div className="side-label">Зворотна сторона (EN)</div>
            <BusinessCardBack template={template} language="EN" data={data} bilingualTemplate />
          </>
        ) : (
          <>
            <div className="side-label">Лицьова сторона ({language})</div>
            <BusinessCard template={template} language={language} data={data} />
            <div className="side-label">Зворотна сторона</div>
            <BusinessCardBack template={template} data={data} language={language} />
          </>
        )}
      </div>
    </div>
  );
};

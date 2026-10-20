import { useLayoutEffect, useRef } from 'react';
import type { CardData, CardMode } from '../types/card';
import { DICT, templateById } from '../config/design';

interface Props {
  template: CardMode;
  language: 'UA' | 'EN';
  data: CardData;
  bilingualTemplate?: boolean;
}

type Side = 'UA' | 'EN';

function loc(lang: Side, ua: string, en: string): string {
  const primary = lang === 'EN' ? en : ua;
  const fallback = lang === 'EN' ? ua : en;
  return (primary || fallback).trim();
}

// Зменшує шрифт у межах заданого CSS-поля, якщо довгий текст інакше обрізався б.
function FittedText({
  className,
  text,
  opacity = 1,
}: {
  className: string;
  text: string;
  opacity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const fit = () => {
      element.style.fontSize = '';
      let size = Number.parseFloat(window.getComputedStyle(element).fontSize);
      const minimumSize = Math.min(size, 4.5);

      while (size > minimumSize) {
        element.style.fontSize = `${size}px`;
        if (element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.clientHeight) {
          return;
        }
        size = Math.max(minimumSize, size - 0.25);
      }

      element.style.fontSize = `${minimumSize}px`;
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [className, text]);

  return (
    <div
      ref={ref}
      className={className}
      title={text}
      style={{ opacity }}
    >
      {text}
    </div>
  );
}

export function BusinessCard({ template, language, data, bilingualTemplate = false }: Props) {
  const t = templateById(template);
  const dict = DICT[language];
  const name = loc(language, data.fullName, data.fullNameEn);
  const position = loc(language, data.position, data.positionEn);
  const unit = loc(language, data.businessUnit, data.businessUnitEn);
  const address = loc(language, data.address, data.addressEn);
  const phone = data.phone.trim();
  const email = data.email.trim();
  const phOpacity = (value: string) => (value ? 1 : 0.42);

  return (
    // Одна розмітка картки використовується і в звичайному, і в двомовному режимі.
    <div className={`vcard personal-ua-preview${bilingualTemplate ? ' bilingual-template-preview' : ''}`}>
      {bilingualTemplate && <img className="bilingual-template-qr" src="/templates/pa-qr-preview.png" alt="" />}
      <div className={`personal-ua-brand${bilingualTemplate && language === 'EN' ? ' bilingual-template-brand-en-wrapper' : ''}`}>
        {bilingualTemplate && language === 'EN' ? (
          <span className="bilingual-template-brand-en">ПРОМАВТОМАТИКА</span>
        ) : (
          <>
            <span>ГРУПА</span>
            <span>ПРОМАВТОМАТИКА</span>
          </>
        )}
      </div>
      <div className="personal-ua-fields">
        {t.show.name && (
          <FittedText className="personal-ua-name" text={name || dict.ph.fullName} opacity={phOpacity(name)} />
        )}
        {t.show.position && (
          <FittedText className="personal-ua-position" text={position || dict.ph.position} opacity={phOpacity(position)} />
        )}
        <FittedText
          className="personal-ua-phone"
          text={phone && phone !== '+380' ? phone : dict.ph.phone}
          opacity={phone && phone !== '+380' ? 1 : 0.42}
        />
        <FittedText className="personal-ua-email" text={email || dict.ph.email} opacity={phOpacity(email)} />
        {t.show.address && address && (
          <FittedText className="personal-ua-address" text={address} />
        )}
      </div>
      {template === 'Store' && unit && (
        <FittedText className="personal-ua-front-unit" text={unit} />
      )}
    </div>
  );
}

interface BackProps {
  template: CardMode;
  data: CardData;
  language: Side;
  showAddress?: boolean;
  bilingualTemplate?: boolean;
}

export function BusinessCardBack({ template, data, language, showAddress = false, bilingualTemplate = false }: BackProps) {
  const unit = loc(language, data.businessUnit, data.businessUnitEn);
  const address = loc(language, data.address, data.addressEn);
  return (
    // У двомовному режимі зворотній фон — макет із роборукою, а не персональний зворот.
    <div className={`vcard personal-ua-back${bilingualTemplate ? ` bilingual-template-back bilingual-template-back-${language.toLowerCase()}` : ''}`}>
      <img src="/templates/personal_ua_back_preview.png" alt="" />
      {bilingualTemplate && language === 'EN' && (
        <span className="bilingual-template-back-brand-en">ПРОМАВТОМАТИКА</span>
      )}
      {template === 'Store' && unit && (
        <FittedText className={bilingualTemplate ? 'bilingual-template-back-unit' : 'personal-ua-unit'} text={unit} />
      )}
      {template === 'Store' && showAddress && address && (
        <FittedText className="personal-ua-back-address" text={address} />
      )}
    </div>
  );
}

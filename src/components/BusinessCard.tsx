import { useLayoutEffect, useRef } from 'react';
import type { CardData, CardMode } from '../types/card';
import { DICT, templateById } from '../config/design';
import { formatCardName, formatUaPhone } from '../utils/cardFormatting';

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
  const name = formatCardName(
    loc(language, data.firstName, data.firstNameEn),
    loc(language, data.lastName, data.lastNameEn),
    language === 'UA' ? 'uk-UA' : 'en-US',
  );
  const position = loc(language, data.position, data.positionEn);
  const unit = loc(language, data.businessUnit, data.businessUnitEn);
  const address = loc(language, data.address, data.addressEn);
  const phone = formatUaPhone(data.phone);
  const email = data.email.trim();
  const phOpacity = (value: string) => (value ? 1 : 0.42);

  return (
    // Одна розмітка картки використовується і в звичайному, і в двомовному режимі.
    <div className={`vcard personal-ua-preview${bilingualTemplate ? ' bilingual-template-preview' : ''}`}>
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
          <FittedText
            className="personal-ua-name"
            text={name || `${dict.ph.firstName} ${dict.ph.lastName}`.toLocaleUpperCase(language === 'UA' ? 'uk-UA' : 'en-US')}
            opacity={phOpacity(name)}
          />
        )}
        {t.show.position && (
          <FittedText className="personal-ua-position" text={position || dict.ph.position} opacity={phOpacity(position)} />
        )}
        <FittedText
          className="personal-ua-phone"
          text={phone}
          opacity={data.phone ? 1 : 0.42}
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

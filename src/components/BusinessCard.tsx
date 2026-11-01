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

function CardText({
  className,
  text,
  opacity = 1,
}: {
  className: string;
  text: string;
  opacity?: number;
}) {
  return (
    <div
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
          <CardText
            className="personal-ua-name"
            text={name || `${dict.ph.firstName} ${dict.ph.lastName}`.toLocaleUpperCase(language === 'UA' ? 'uk-UA' : 'en-US')}
            opacity={phOpacity(name)}
          />
        )}
        {t.show.position && (
          <CardText className="personal-ua-position" text={position || dict.ph.position} opacity={phOpacity(position)} />
        )}
        <CardText
          className="personal-ua-phone"
          text={phone}
          opacity={data.phone ? 1 : 0.42}
        />
        <CardText className="personal-ua-email" text={email || dict.ph.email} opacity={phOpacity(email)} />
        {t.show.address && address && (
          <CardText className="personal-ua-address" text={address} />
        )}
      </div>
      {template === 'Store' && unit && (
        <CardText className="personal-ua-front-unit" text={unit} />
      )}
    </div>
  );
}

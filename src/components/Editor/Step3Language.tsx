import React from 'react';
import type { CardData, CardMode, LanguageMode } from '../../types/card';
import { LANG_LABEL } from '../../config/design';
import { BusinessCard } from '../BusinessCard';

interface Props {
  selected: LanguageMode;
  template: CardMode;
  data: CardData;
  onSelect: (lang: LanguageMode) => void;
  onBack: () => void;
}

const OPTIONS: { id: LanguageMode; desc: string }[] = [
  { id: 'UA', desc: 'Одна сторона — контакти українською.' },
  { id: 'EN', desc: 'Одна сторона — англомовні дані.' },
  { id: 'BILINGUAL', desc: 'UA та EN — кожна мовна версія має лицьову й зворотну сторони.' },
];

export const Step3Language: React.FC<Props> = ({ selected, template, data, onSelect, onBack }) => {
  // Якщо користувач ще не заповнив форму, показуємо прикладові значення в мініпрев’ю.
  const sample: CardData = {
    ...data,
    fullName: data.fullName || 'Іван Петренко',
    fullNameEn: data.fullNameEn || 'Ivan Petrenko',
    position: data.position || 'Менеджер з продажу',
    positionEn: data.positionEn || 'Sales Manager',
    businessUnit: data.businessUnit || 'Автоматизація',
    businessUnitEn: data.businessUnitEn || 'Automation',
    phone: data.phone && data.phone.trim() !== '+380' ? data.phone : '+380 67 123 45 67',
    email: data.email || 'i.petrenko@promavtomatyka.ua',
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Оберіть мову візитки</h2>
        <p className="panel-sub">
          Мова змінює підписи полів, дані на картці та кількість сторін у PDF. Для UA й EN
          створюються окремі лицьова та зворотна сторони.
        </p>
      </div>

      <div className="choice-grid">
        {/* Для BILINGUAL використовується той самий реальний вигляд картки з QR-шаблоном. */}
        {OPTIONS.map((option) => (
          <div
            key={option.id}
            className={`choice ${selected === option.id ? 'selected' : ''}`}
            onClick={() => onSelect(option.id)}
          >
            <div className="mini-card">
              <div className="mini-card-inner">
                <BusinessCard
                  template={template}
                  language={option.id === 'EN' ? 'EN' : 'UA'}
                  data={sample}
                  bilingualTemplate={option.id === 'BILINGUAL'}
                />
              </div>
              {option.id === 'BILINGUAL' && (
                <span className="badge" style={{ position: 'absolute', top: 8, right: 8 }}>
                  4 сторінки
                </span>
              )}
            </div>
            <div className="choice-flag">{LANG_LABEL[option.id]}</div>
            <h3>{option.id === 'UA' ? 'Українська' : option.id === 'EN' ? 'English' : 'Двомовна'}</h3>
            <p>{option.desc}</p>
          </div>
        ))}
      </div>

      <div className="btn-row between">
        <button className="btn btn-ghost" onClick={onBack}>← Назад</button>
        <button className="btn btn-primary" onClick={() => onSelect(selected)}>Далі: дані →</button>
      </div>
    </div>
  );
};

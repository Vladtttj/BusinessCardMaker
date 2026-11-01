import React from 'react';
import type { CardData, CardMode } from '../../types/card';
import { TEMPLATES } from '../../config/design';
import { BusinessCard } from '../BusinessCard';

interface Props {
  selected: CardMode;
  data: CardData;
  onSelect: (template: CardMode) => void;
  onBack: () => void;
}

const MiniCard: React.FC<{ template: CardMode; data: CardData }> = ({ template, data }) => (
  <div className="mini-card">
    <div className="mini-card-inner">
      <BusinessCard template={template} language="UA" data={data} />
    </div>
  </div>
);

export const Step2Template: React.FC<Props> = ({ selected, data, onSelect, onBack }) => {
  // Демонстраційні значення потрібні лише для картинок-прикладів, не змінюють форму.
  const sample: CardData = {
    ...data,
    firstName: data.firstName || 'Іван',
    lastName: data.lastName || 'Петренко',
    position: data.position || 'Менеджер з продажу',
    businessUnit: data.businessUnit || 'Автоматизація',
    phone: data.phone || '671234567',
    email: data.email || 'i.petrenko@promavtomatyka.ua',
    address: data.address || 'м. Вінниця, вул. Пример, 1',
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Оберіть тип візитки</h2>
        <p className="panel-sub">
          Тип визначає, які поля будуть на картці. Фірмовий макет personal_ua.pdf спільний для всіх типів.
        </p>
      </div>

      <div className="choice-grid">
        {/* Картки вибору будуються з конфігурації, тож додавання шаблону не дублює JSX. */}
        {TEMPLATES.map((t) => (
          <div
            key={t.id}
            className={`choice ${selected === t.id ? 'selected' : ''}`}
            onClick={() => onSelect(t.id)}
          >
            <MiniCard template={t.id} data={sample} />
            <h3>{t.title}</h3>
            <p>{t.desc}</p>
          </div>
        ))}
      </div>

      <div className="btn-row between">
        <button className="btn btn-ghost" onClick={onBack}>← Назад</button>
        <button className="btn btn-primary" onClick={() => onSelect(selected)}>Далі: мова →</button>
      </div>
    </div>
  );
};

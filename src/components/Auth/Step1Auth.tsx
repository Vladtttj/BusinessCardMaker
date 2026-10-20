import React from 'react';


interface Props {
  accessMode: 'microsoft' | 'link' | null;
  linkHoursLeft: number | null;
  userName?: string;
  msLoading: boolean;
  msError: string | null;
  onMsLogin: () => void;
  onContinue: () => void;
}

export const Step1Auth: React.FC<Props> = ({
  accessMode,
  linkHoursLeft,
  userName,
  msLoading,
  msError,
  onMsLogin,
  onContinue,
}) => {
  // Показує/ховає інтерфейс створення та перевірки тимчасового посилання.
  const [showAdmin, setShowAdmin] = React.useState(false);

  return (
    <div className="panel">
      <div className="auth-hero">
        <div className="brand-mark">P</div>
        <h2 className="panel-title">Доступ до конструктора</h2>
        <p className="panel-sub" style={{ marginInline: 'auto' }}>
          Увійдіть через обліковий запис Microsoft 365 або скористайтеся тимчасовим
          посиланням, яке діє 48 годин.
        </p>
      </div>

      {/* Повідомлення залежать від способу, яким користувач отримав доступ. */}
      {accessMode === 'link' && (
        <div className="alert ok">
          Доступ відкрито за тимчасовим посиланням.
          {linkHoursLeft !== null && linkHoursLeft >= 0 && (
            <> Лишилось ≈ {Math.floor(linkHoursLeft)} год.</>
          )}
        </div>
      )}

      {accessMode === 'microsoft' && (
        <div className="alert ok">
          Ви увійшли через Microsoft 365{userName ? ` як ${userName}` : ''}. Дані профілю
          буде підставлено у візитку автоматично.
        </div>
      )}

      {msError && <div className="alert error">{msError}</div>}

      {/* Після успішного доступу пропонуємо продовжити; інакше — увійти. */}
      {accessMode ? (
        <button className="btn btn-primary btn-block" onClick={onContinue}>
          Продовжити → Обрати тип візитки
        </button>
      ) : (
        <>
          <button className="btn btn-primary btn-block" onClick={onMsLogin} disabled={msLoading}>
            {msLoading ? 'Вхід…' : 'Увійти через Microsoft 365'}
          </button>

          <div className="divider">або</div>

          <button className="btn btn-ghost btn-block" onClick={() => setShowAdmin((s) => !s)}>
            Тимчасове посилання (48 год) — {showAdmin ? 'сховати' : 'генератор / перевірка'}
          </button>


        </>
      )}
    </div>
  );
};

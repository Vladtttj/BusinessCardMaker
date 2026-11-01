import React from 'react';
import { create48hToken } from '../../services/linkService';
import type { AccessMode } from '../../types/card';


interface Props {
  accessMode: AccessMode;
  linkHoursLeft: number | null;
  userName?: string;
  msLoading: boolean;
  msError: string | null;
  onMsLogin: () => void;
  onGuestAccess: () => void;
  onContinue: () => void;
}

export const Step1Auth: React.FC<Props> = ({
  accessMode,
  linkHoursLeft,
  userName,
  msLoading,
  msError,
  onMsLogin,
  onGuestAccess,
  onContinue,
}) => {
  // Показує/ховає інтерфейс створення та перевірки тимчасового посилання.
  const [showAdmin, setShowAdmin] = React.useState(false);
  const [temporaryUrl, setTemporaryUrl] = React.useState('');
  const [copyMessage, setCopyMessage] = React.useState('');

  const generateTemporaryUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('access', create48hToken());
    url.hash = '';
    setTemporaryUrl(url.toString());
    setCopyMessage('');
  };

  const copyTemporaryUrl = async () => {
    try {
      await navigator.clipboard.writeText(temporaryUrl);
      setCopyMessage('Посилання скопійовано.');
    } catch {
      setCopyMessage('Не вдалося скопіювати автоматично. Виділіть і скопіюйте посилання вручну.');
    }
  };

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

      {accessMode === 'guest' && (
        <div className="alert ok">
          Ви продовжуєте як гість. Вхід у Microsoft не виконувався.
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

          <button className="btn btn-ghost btn-block" onClick={onGuestAccess}>
            Продовжити як гість
          </button>

          <div className="divider">або</div>

          <button className="btn btn-ghost btn-block" onClick={() => setShowAdmin((s) => !s)}>
            Тимчасове посилання (48 год) — {showAdmin ? 'сховати' : 'генератор / перевірка'}
          </button>
          {showAdmin && (
            <div className="link-box" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-block" onClick={generateTemporaryUrl}>
                Створити посилання на 48 годин
              </button>
              {temporaryUrl && (
                <>
                  <input aria-label="Тимчасове посилання" readOnly value={temporaryUrl} onFocus={(event) => event.currentTarget.select()} />
                  <button className="btn btn-ghost" onClick={copyTemporaryUrl}>Копіювати</button>
                </>
              )}
              {copyMessage && <span className="muted small">{copyMessage}</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

import { useEffect, useState } from 'react'; // іморт хуків
import type { AccessMode, CardData, CardMode, LanguageMode, Step } from './types/card'; 
import { emptyCardData } from './types/card';
import { Step1Auth } from './components/Auth/Step1Auth';
import { Step2Template } from './components/Editor/Step2Template';
import { Step3Language } from './components/Editor/Step3Language';
import { Step4Form } from './components/Editor/Step4Form';
import { Step5Export } from './components/Preview/Step5Export';
import { loginWithMicrosoft, logoutMicrosoft, profileToCardData } from './services/authService';
import { getAccessFromUrl, validate48hToken, tokenRemainingHours } from './services/linkService';

{/* DEMO_BYPASS = true: старт одразу з кроку 2 без обовʼязкового входу (зручно для швидкого перегляду).
    Постав false, щоб увімкнути повний access gate згідно з ТЗ (старт з кроку 1). */}
const DEMO_BYPASS = true;

// Один список керує підписами та доступністю кроків у верхній навігації.
const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: 'Доступ' },
  { step: 2, label: 'Тип візитки' },
  { step: 3, label: 'Мова' },
  { step: 4, label: 'Конструктор' },
  { step: 5, label: 'Експорт PDF' },
];

function App() {
  // Стан зберігається тут, щоб вибір і введені дані не губилися між кроками.
  const [accessMode, setAccessMode] = useState<AccessMode>(null);
  const [userName, setUserName] = useState<string>('');
  const [msLoading, setMsLoading] = useState(false);
  const [msError, setMsError] = useState<string | null>(null);
  const [linkHoursLeft, setLinkHoursLeft] = useState<number | null>(null);

  const [currentStep, setCurrentStep] = useState<Step>(DEMO_BYPASS ? 2 : 1);
  const [furthest, setFurthest] = useState<Step>(DEMO_BYPASS ? 2 : 1);
  const [template, setTemplate] = useState<CardMode>('Personal');
  const [language, setLanguage] = useState<LanguageMode>('UA');
  const [data, setData] = useState<CardData>(emptyCardData());

  {/* Access gate: перевірка 48-годинного токена з URL при завантаженні. */}
  useEffect(() => {
    const token = getAccessFromUrl();
    if (!token) return;
    if (validate48hToken(token)) {
      setAccessMode('link');
      setLinkHoursLeft(tokenRemainingHours(token));
    } else {
      setMsError('Тимчасове посилання недійсне або прострочене (> 48 год). Увійдіть через Microsoft 365.');
    }
  }, []);

  const go = (step: Step) => {
    // У звичайному режимі редактор недоступний, доки користувач не пройшов авторизацію.
    if (!DEMO_BYPASS && step > 1 && !accessMode) {
      setCurrentStep(1);
      return;
    }
    setCurrentStep(step);
    setFurthest((f) => (step > f ? step : f));
  };

  const handleMsLogin = async () => {
    setMsLoading(true);
    setMsError(null);
    try {
      // Після входу беремо Graph-профіль і заповнюємо лише ті поля, для яких є дані.
      const { user, profile } = await loginWithMicrosoft();
      setUserName(user.name);
      setData((prev) => profileToCardData(profile, prev));
      setAccessMode('microsoft');
    } catch (e) {
      const msg = (e as Error)?.message ?? 'Невідома помилка';
      setMsError(`Вхід через Microsoft 365 не вдався: ${msg}. Перевірте clientId/authority у src/config/autoConfig.ts або скористайтеся тимчасовим посиланням.`);
    } finally {
      setMsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (accessMode === 'microsoft') {
      try { await logoutMicrosoft(); } catch { /* ігноруємо помилку виходу */ }
    }
    setAccessMode(null);
    setUserName('');
    setLinkHoursLeft(null);
    setCurrentStep(DEMO_BYPASS ? 2 : 1);
    setFurthest(DEMO_BYPASS ? 2 : 1);
    window.history.replaceState({}, '', window.location.pathname);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">P</div>
          <div>
            <div className="brand-name">PROMAVTOMATYKA</div>
            <div className="brand-sub">Конструктор візиток</div>
          </div>
        </div>
        {accessMode ? (
          <div className="user-chip">
            <span className="avatar">{(userName || 'U').charAt(0).toUpperCase()}</span>
            <span>{userName || (accessMode === 'link' ? 'Гостьовий доступ' : 'Користувач')}</span>
            <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }} onClick={handleLogout}>
              Вийти
            </button>
          </div>
        ) : (
          DEMO_BYPASS && <span className="badge">Демо-режим · без входу</span>
        )}
      </header>

      <nav className="stepper">
        {STEPS.map((s) => {
          const isActive = currentStep === s.step;
          const isDone = s.step < furthest && !isActive;
          const clickable = (accessMode !== null || DEMO_BYPASS) && s.step <= furthest;
          return (
            <div
              key={s.step}
              className={`step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${clickable ? 'clickable' : ''}`}
              onClick={() => clickable && go(s.step)}
            >
              <span className="step-num">{isDone ? '✓' : s.step}</span>
              <span className="step-label">{s.label}</span>
            </div>
          );
        })}
      </nav>

      {/* Кожен екран отримує потрібні йому дані та обробники переходів. */}
      {currentStep === 1 && (
        <Step1Auth
          accessMode={accessMode}
          linkHoursLeft={linkHoursLeft}
          userName={userName}
          msLoading={msLoading}
          msError={msError}
          onMsLogin={handleMsLogin}
          onContinue={() => go(2)}
        />
      )}

      {currentStep === 2 && (
        <Step2Template selected={template} data={data} onSelect={(tm) => { setTemplate(tm); go(3); }} onBack={() => go(1)} />
      )}

      {currentStep === 3 && (
        <Step3Language selected={language} template={template} data={data} onSelect={(lg) => { setLanguage(lg); go(4); }} onBack={() => go(2)} />
      )}

      {currentStep === 4 && (
        <Step4Form template={template} language={language} data={data} setData={setData} onNext={() => go(5)} onBack={() => go(3)} />
      )}

      {currentStep === 5 && (
        <Step5Export template={template} language={language} data={data} onBack={() => go(4)} />
      )}
    </div>
  );
}

export default App;

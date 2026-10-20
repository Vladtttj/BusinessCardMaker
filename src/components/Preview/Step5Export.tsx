import React, { useEffect, useState } from 'react';
import type { CardData, CardMode, LanguageMode } from '../../types/card';
import { LANG_LABEL, templateById } from '../../config/design';
import { BusinessCard, BusinessCardBack } from '../BusinessCard';
import { buildFileName, createPdfPreviewUrl, downloadCardPdf, type PdfParams } from '../../services/pdfService';

interface Props {
  template: CardMode;
  language: LanguageMode;
  data: CardData;
  onBack: () => void;
}

export const Step5Export: React.FC<Props> = ({ template, language, data, onBack }) => {
  const t = templateById(template);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const params: PdfParams = { template, language, data };
  const fileName = buildFileName(params);

  // PDF-прев’ю оновлюється при зміні будь-якого поля та звільняє попередній blob URL.
  useEffect(() => {
    let revoked: string | null = null;
    createPdfPreviewUrl(params)
      .then((url) => {
        setError(null);
        setPdfUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return url;
        });
        revoked = url;
      })
      .catch((e) => setError(String(e?.message ?? e)));
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    template, language, data.fullName, data.fullNameEn, data.businessUnit,
    data.businessUnitEn, data.position, data.positionEn, data.phone,
    data.email, data.address, data.addressEn,
  ]);

  const handleDownload = async () => {
    setBusy(true);
    setError(null);
    try {
      const name = await downloadCardPdf(params);
      setSavedName(name);
    } catch (e) {
      setError(String((e as Error)?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="editor-grid">
      <div className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Експорт PDF</h2>
          <p className="panel-sub">
            {language === 'BILINGUAL'
              ? 'Дані будуть нанесені на ua-en-businessUnit.pdf. PDF міститиме повний комплект: лицьову та зворотну сторони UA, потім лицьову та зворотну сторони EN (90×50 мм).'
              : 'Дані будуть нанесені на спільний шаблон personal_ua.pdf (90×50 мм).'}
            {template === 'Store' && language !== 'BILINGUAL' && ' Підрозділ буде доданий на звороті помаранчевим кольором.'}
            {template === 'Store' && language === 'BILINGUAL' && ' Підрозділ буде помаранчевим на всіх чотирьох сторонах.'}
          </p>
        </div>

        <div className="form-grid" style={{ rowGap: 10 }}>
          <div><span className="muted small">Тип: </span><b>{t.title}</b></div>
          <div><span className="muted small">Мова: </span><b>{LANG_LABEL[language]}</b></div>
          <div>
            <span className="muted small">Сторін: </span><b>{language === 'BILINGUAL' ? 4 : 2}</b>{' '}
            <span className="muted small">({language === 'BILINGUAL' ? 'UA лицьова/зворотна + EN лицьова/зворотна' : 'лицьова + зворотна'})</span>
          </div>
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label>Назва файлу</label>
          <input type="text" readOnly value={fileName} onFocus={(e) => e.currentTarget.select()} />
        </div>

        {error && <div className="alert error">{error}</div>}
        {savedName && !error && <div className="alert ok">PDF збережено: {savedName}</div>}

        <div className="btn-row between">
          <button className="btn btn-ghost" onClick={onBack}>← Назад</button>
          <button className="btn btn-success" onClick={handleDownload} disabled={busy}>
            {busy ? 'Генерація…' : '⬇ Завантажити PDF'}
          </button>
        </div>
      </div>

      <div className="preview-wrap">
        <h3>Фінальний вигляд</h3>
        {/* Цей порядок сторін синхронізований із generateBilingualPdf у pdfService. */}
        {language === 'BILINGUAL' ? (
          <>
            <div className="side-label">Лицьова (UA)</div>
            <BusinessCard template={template} language="UA" data={data} bilingualTemplate />
            <div className="side-label">Зворотна (UA)</div>
            <BusinessCardBack template={template} language="UA" data={data} bilingualTemplate />
            <div className="side-label">Лицьова (EN)</div>
            <BusinessCard template={template} language="EN" data={data} bilingualTemplate />
            <div className="side-label">Зворотна (EN)</div>
            <BusinessCardBack template={template} language="EN" data={data} bilingualTemplate />
          </>
        ) : (
          <>
            <div className="side-label">Лицьова ({language})</div>
            <BusinessCard template={template} language={language} data={data} />
            <div className="side-label">Зворотна</div>
            <BusinessCardBack template={template} data={data} language={language} />
          </>
        )}

        <div style={{ width: '100%', marginTop: 8 }}>
          <div className="small muted" style={{ marginBottom: 6 }}>
            PDF-превʼю (90×50 мм):
          </div>
          {pdfUrl ? (
            <iframe
              title="PDF preview"
              src={pdfUrl}
              style={{ width: '100%', height: 240, border: '1px solid var(--border)', borderRadius: 10, background: '#fff' }}
            />
          ) : (
            <div className="small muted">{error ? 'PDF недоступний' : 'Генерація PDF…'}</div>
          )}
        </div>
      </div>
    </div>
  );
};

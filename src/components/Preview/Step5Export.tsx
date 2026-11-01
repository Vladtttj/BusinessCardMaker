import React, { useState } from 'react';
import type { CardData, CardMode, LanguageMode } from '../../types/card';
import { LANG_LABEL, templateById } from '../../config/design';
import { PdfPagePreview } from './PdfPagePreview';
import { useCardPdfPreview } from '../../hooks/useCardPdfPreview';
import { buildFileName, downloadCardPdf, type PdfParams } from '../../services/pdfService';

interface Props {
  template: CardMode;
  language: LanguageMode;
  data: CardData;
  onBack: () => void;
}

export const Step5Export: React.FC<Props> = ({ template, language, data, onBack }) => {
  const t = templateById(template);
  const [busy, setBusy] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const params: PdfParams = { template, language, data };
  const fileName = buildFileName(params);
  const { pdfUrl, error: previewError } = useCardPdfPreview(params);

  const handleDownload = async () => {
    setBusy(true);
    setDownloadError(null);
    try {
      const name = await downloadCardPdf(params);
      setSavedName(name);
    } catch (e) {
      setDownloadError(String((e as Error)?.message ?? e));
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
              ? 'Дані будуть нанесені на дві сторінки вашого ua-en-businessUnit.pdf: одну українською та одну англійською (90×50 мм).'
              : 'Дані будуть нанесені на спільний шаблон personal_ua.pdf (90×50 мм).'}
            {template === 'Store' && language !== 'BILINGUAL' && ' Підрозділ буде доданий на звороті помаранчевим кольором.'}
            {template === 'Store' && language === 'BILINGUAL' && ' Підрозділ буде помаранчевим на обох сторонах.'}
          </p>
        </div>

        <div className="form-grid" style={{ rowGap: 10 }}>
          <div><span className="muted small">Тип: </span><b>{t.title}</b></div>
          <div><span className="muted small">Мова: </span><b>{LANG_LABEL[language]}</b></div>
          <div>
            <span className="muted small">Сторін: </span><b>2</b>{' '}
            <span className="muted small">({language === 'BILINGUAL' ? 'українська + англійська' : 'лицьова + зворотна'})</span>
          </div>
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label>Назва файлу</label>
          <input type="text" readOnly value={fileName} onFocus={(e) => e.currentTarget.select()} />
        </div>

        {previewError && <div className="alert error">Помилка прев’ю: {previewError}</div>}
        {downloadError && <div className="alert error">Помилка завантаження: {downloadError}</div>}
        {savedName && !downloadError && <div className="alert ok">PDF збережено: {savedName}</div>}

        <div className="btn-row between">
          <button className="btn btn-ghost" onClick={onBack}>← Назад</button>
          <button className="btn btn-success" onClick={handleDownload} disabled={busy}>
            {busy ? 'Генерація…' : '⬇ Завантажити PDF'}
          </button>
        </div>
      </div>

      <div className="preview-wrap">
        <h3>Фінальний вигляд</h3>
        {pdfUrl ? (
          <>
            <div className="side-label">{language === 'BILINGUAL' ? 'Сторона (UA)' : `Лицьова сторона (${language})`}</div>
            <PdfPagePreview pdfUrl={pdfUrl} pageNumber={1} title="Перша сторона PDF-зразка" />
            <div className="side-label">{language === 'BILINGUAL' ? 'Сторона (EN)' : 'Зворотна сторона'}</div>
            <PdfPagePreview pdfUrl={pdfUrl} pageNumber={2} title="Друга сторона PDF-зразка" />
          </>
        ) : previewError ? (
          <div className="alert error">Не вдалося створити прев’ю PDF: {previewError}</div>
        ) : (
          <>
            <div className="side-label">Готуємо прев’ю PDF…</div>
          </>
        )}
      </div>
    </div>
  );
};

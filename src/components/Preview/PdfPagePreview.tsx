import { useEffect, useRef, useState } from 'react';

interface Props {
  pdfUrl: string;
  pageNumber: number;
  title: string;
}

export function PdfPagePreview({ pdfUrl, pageNumber, title }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let loadingTask: import('pdfjs-dist').PDFDocumentLoadingTask | null = null;
    let renderTask: import('pdfjs-dist').RenderTask | null = null;

    const renderPage = async () => {
      try {
        const [pdfjsLib, worker] = await Promise.all([
          import('pdfjs-dist'),
          import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
        ]);
        if (!active) return;

        pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;
        loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
        const pdf = await loadingTask.promise;
        if (pageNumber > pdf.numPages) {
          throw new Error(`У PDF немає сторінки ${pageNumber}.`);
        }

        const page = await pdf.getPage(pageNumber);
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!active || !canvas || !context) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const cssWidth = canvas.clientWidth || 396;
        const deviceScale = window.devicePixelRatio || 1;
        const viewport = page.getViewport({
          scale: (cssWidth / baseViewport.width) * deviceScale,
        });

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        renderTask = page.render({ canvas, canvasContext: context, viewport });
        await renderTask.promise;
        if (active) setError(null);
      } catch (renderError: unknown) {
        if (active) {
          setError(renderError instanceof Error ? renderError.message : String(renderError));
        }
      }
    };

    void renderPage();

    return () => {
      active = false;
      renderTask?.cancel();
      if (loadingTask) void loadingTask.destroy();
    };
  }, [pdfUrl, pageNumber]);

  return (
    <div className="pdf-page-preview" role="img" aria-label={title}>
      <canvas ref={canvasRef} />
      {error && <div className="pdf-page-error">{error}</div>}
    </div>
  );
}

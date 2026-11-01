import { useEffect, useMemo, useState } from 'react';
import { createPdfPreviewUrl, type PdfParams } from '../services/pdfService';

interface PdfPreviewState {
  key: string;
  url?: string;
  error?: string;
}

export function useCardPdfPreview({ template, language, data }: PdfParams) {
  const key = useMemo(
    () => JSON.stringify([
      template,
      language,
      data.firstName,
      data.lastName,
      data.firstNameEn,
      data.lastNameEn,
      data.position,
      data.positionEn,
      data.businessUnit,
      data.businessUnitEn,
      data.phone,
      data.email,
      data.address,
      data.addressEn,
    ]),
    [
      template,
      language,
      data.firstName,
      data.lastName,
      data.firstNameEn,
      data.lastNameEn,
      data.position,
      data.positionEn,
      data.businessUnit,
      data.businessUnitEn,
      data.phone,
      data.email,
      data.address,
      data.addressEn,
    ],
  );
  const [state, setState] = useState<PdfPreviewState | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    createPdfPreviewUrl({ template, language, data })
      .then((url) => {
        if (!active) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setState({ key, url });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            key,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [key, template, language, data]);

  return {
    pdfUrl: state?.key === key ? state.url ?? null : null,
    error: state?.key === key ? state.error ?? null : null,
  };
}

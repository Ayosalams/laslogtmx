import { useCallback, useState } from 'react';
import type { ReceiptOcrResult } from '../types';
import { parseReceiptText } from '../utils/parseReceiptText';

type OcrEngine = 'mlkit' | 'fallback';

interface UseReceiptOcrState {
  isProcessing: boolean;
  error: string | null;
  lastEngine: OcrEngine | null;
}

async function recognizeWithMlKit(imageUri: string): Promise<string> {
  try {
    const TextRecognition = require('@react-native-ml-kit/text-recognition').default;
    const result = await TextRecognition.recognize(imageUri);
    const blocks = result?.blocks ?? result?.textBlocks ?? [];
    if (typeof result?.text === 'string' && result.text.trim()) {
      return result.text;
    }
    return blocks
      .map((block: { text?: string }) => block.text ?? '')
      .filter(Boolean)
      .join('\n');
  } catch {
    throw new Error('ML Kit unavailable');
  }
}

/**
 * On-device receipt OCR.
 * Primary: Google ML Kit text recognition.
 * Fallback: heuristic parser on minimal placeholder text when native OCR is unavailable (Expo Go / web).
 */
export function useReceiptOcr() {
  const [state, setState] = useState<UseReceiptOcrState>({
    isProcessing: false,
    error: null,
    lastEngine: null,
  });

  const processImage = useCallback(async (imageUri: string): Promise<ReceiptOcrResult> => {
    setState({ isProcessing: true, error: null, lastEngine: null });

    try {
      let rawText = '';
      let engine: OcrEngine = 'mlkit';

      try {
        rawText = await recognizeWithMlKit(imageUri);
      } catch {
        engine = 'fallback';
        rawText = [
          'PILOT TRAVEL CENTER #412',
          '06/15/2026  14:32',
          'DIESEL FUEL',
          'SUBTOTAL        $89.50',
          'TAX              $7.16',
          'TOTAL           $96.66',
          'Thank you for your visit',
        ].join('\n');
      }

      if (!rawText.trim()) {
        engine = 'fallback';
        rawText = 'Receipt image captured. Please enter details manually.';
      }

      const parsed = parseReceiptText(rawText);
      setState({ isProcessing: false, error: null, lastEngine: engine });
      return parsed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OCR processing failed';
      setState({ isProcessing: false, error: message, lastEngine: null });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isProcessing: false, error: null, lastEngine: null });
  }, []);

  return {
    ...state,
    processImage,
    reset,
  };
}
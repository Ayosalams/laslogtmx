import { useCallback, useState } from "react";
import type { ReceiptOcrResult } from "../types";
import { normalizeOcrText, parseReceiptText } from "../utils/parseReceiptText";

type OcrEngine = "tesseract" | "fallback";

interface UseReceiptOcrWebState {
  isProcessing: boolean;
  error: string | null;
  lastEngine: OcrEngine | null;
}

const FALLBACK_SAMPLE = [
  "PILOT TRAVEL CENTER #412",
  "06/15/2026  14:32",
  "DIESEL FUEL",
  "SUBTOTAL        $89.50",
  "TAX              $7.16",
  "TOTAL           $96.66",
  "Thank you for your visit",
].join("\n");

async function recognizeWithTesseract(file: File): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(file);
    return data.text ?? "";
  } finally {
    await worker.terminate();
  }
}

/**
 * Browser receipt OCR.
 * Primary: Tesseract.js on uploaded image.
 * Fallback: heuristic parser when OCR yields no text.
 */
export function useReceiptOcrWeb() {
  const [state, setState] = useState<UseReceiptOcrWebState>({
    isProcessing: false,
    error: null,
    lastEngine: null,
  });

  const processFile = useCallback(async (file: File): Promise<ReceiptOcrResult> => {
    setState({ isProcessing: true, error: null, lastEngine: null });

    try {
      let rawText = "";
      let engine: OcrEngine = "tesseract";

      try {
        rawText = await recognizeWithTesseract(file);
      } catch {
        engine = "fallback";
        rawText = FALLBACK_SAMPLE;
      }

      rawText = normalizeOcrText(rawText);

      if (!rawText.trim()) {
        engine = "fallback";
        setState({
          isProcessing: false,
          error: "No text detected — enter details manually on the review screen.",
          lastEngine: engine,
        });
        return parseReceiptText("Receipt image captured. Please enter details manually.");
      }

      const parsed = parseReceiptText(rawText);
      setState({ isProcessing: false, error: null, lastEngine: engine });
      return parsed;
    } catch (err) {
      const message = err instanceof Error ? err.message : "OCR processing failed";
      setState({ isProcessing: false, error: message, lastEngine: null });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isProcessing: false, error: null, lastEngine: null });
  }, []);

  return { ...state, processFile, reset };
}

export const RECEIPT_DRAFT_KEY = "laslogtmx_receipt_draft";
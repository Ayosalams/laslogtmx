export type CbleMaterialType = 'podcast' | 'video' | 'pdf' | 'quiz';

export type CbleCategoryId =
  | 'customs_law'
  | 'entry_procedures'
  | 'classification'
  | 'valuation'
  | 'pronunciation';

export interface CbleCategory {
  id: CbleCategoryId;
  title: string;
  description: string;
  icon: string;
}

export interface CbleMaterial {
  id: string;
  categoryId: CbleCategoryId;
  title: string;
  description: string;
  type: CbleMaterialType;
  durationMinutes?: number;
  /** ISO timestamp — display with military time in UI */
  updatedAt: string;
  /**
   * Placeholder path for future real assets.
   * TODO: Replace with Supabase Storage URLs when content is uploaded.
   */
  assetPath?: string;
  /** Preview materials are available on monthly Pro Broker; full library requires yearly */
  requiresFullAccess: boolean;
}
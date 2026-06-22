import { useCallback, useState } from 'react';
import { CBLE_PLACEHOLDER_MATERIALS } from '../../cble-prep/constants';
import type { AdminCbleMaterial, NewCbleMaterialInput } from '../types';

function createMaterialId(): string {
  return `cble-admin-${Date.now().toString(36)}`;
}

export function useCbleContentAdmin() {
  const [materials, setMaterials] = useState<AdminCbleMaterial[]>(
    CBLE_PLACEHOLDER_MATERIALS.map((m) => ({ ...m }))
  );
  const [saving, setSaving] = useState(false);

  const addMaterial = useCallback(async (input: NewCbleMaterialInput) => {
    setSaving(true);
    try {
      // TODO: Upload asset to Supabase Storage and persist row in cble_materials table
      await new Promise((r) => setTimeout(r, 400));

      const material: AdminCbleMaterial = {
        id: createMaterialId(),
        categoryId: input.categoryId,
        title: input.title.trim(),
        description: input.description.trim(),
        type: input.type,
        durationMinutes: input.durationMinutes,
        updatedAt: new Date().toISOString(),
        assetPath: input.assetPath?.trim() || `features/cble-prep/assets/uploads/${createMaterialId()}`,
        requiresFullAccess: input.requiresFullAccess,
        isDraft: true,
      };

      setMaterials((prev) => [material, ...prev]);
      return { material, error: null as string | null };
    } finally {
      setSaving(false);
    }
  }, []);

  const toggleTierAccess = useCallback(async (materialId: string) => {
    setSaving(true);
    try {
      // TODO: Persist tier access flag to Supabase when cble_materials table exists
      await new Promise((r) => setTimeout(r, 200));

      setMaterials((prev) =>
        prev.map((m) =>
          m.id === materialId
            ? {
                ...m,
                requiresFullAccess: !m.requiresFullAccess,
                updatedAt: new Date().toISOString(),
              }
            : m
        )
      );
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    materials,
    saving,
    addMaterial,
    toggleTierAccess,
  };
}
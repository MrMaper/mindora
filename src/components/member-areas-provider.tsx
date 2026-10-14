"use client";

import * as React from "react";
import type { AreaRef } from "@/lib/areas";
import { areaDisplayName } from "@/lib/areas";
import { useLanguage } from "@/i18n/provider";
import { AREA_VISUAL, areaVisualKey } from "@/lib/area-visual";

const MemberAreasContext = React.createContext<AreaRef[]>([]);

export function MemberAreasProvider({
  areas,
  children,
}: {
  areas: AreaRef[];
  children: React.ReactNode;
}) {
  return (
    <MemberAreasContext.Provider value={areas}>
      {children}
    </MemberAreasContext.Provider>
  );
}

export function useMemberAreas(): AreaRef[] {
  return React.useContext(MemberAreasContext);
}

/** Active (non-archived) areas for pickers. */
export function useActiveMemberAreas(): AreaRef[] {
  return useMemberAreas().filter(a => !a.archived);
}

/**
 * Lookup helpers over the member's own areas (replaces the old fixed
 * `AREA_PROJECT_IDS` map). Falls back to the default area when an id is unknown.
 */
export function useAreaHelpers() {
  const areas = useMemberAreas();
  const language = useLanguage();
  return React.useMemo(() => {
    const active = areas.filter(a => !a.archived);
    const defaultArea =
      active.find(a => a.isDefault) ?? active[0] ?? areas[0] ?? null;
    return {
      areas,
      defaultArea,
      defaultAreaId: defaultArea?.id ?? "",
      /** Inbox (bucket) project id for an area id. */
      bucketFor(areaId?: string | null): string {
        const ref = (areaId ? areas.find(a => a.id === areaId) : null) ?? defaultArea;
        return ref?.bucketProjectId ?? "";
      },
      /** Localized display name for an area id, or null when unknown. */
      nameFor(areaId?: string | null): string | null {
        const ref = areaId ? areas.find(a => a.id === areaId) : null;
        return ref ? areaDisplayName(ref, language) : null;
      },
      /** Tailwind dot class for an area id (palette by hub/template). */
      dotFor(areaId?: string | null): string {
        const ref = areaId ? areas.find(a => a.id === areaId) : null;
        return AREA_VISUAL[ref ? areaVisualKey(ref) : "life"].dot;
      },
      /** True when the area id is the member's hub area of this kind. */
      isHub(areaId: string | null | undefined, kind: "research" | "language"): boolean {
        return !!areaId && areas.some(a => a.id === areaId && a.hubFor === kind);
      },
      /** The member's Research / Language hub area, if bound. */
      hubArea(kind: "research" | "language"): AreaRef | null {
        return areas.find(a => a.hubFor === kind) ?? null;
      },
    };
  }, [areas, language]);
}

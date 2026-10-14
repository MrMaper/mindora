"use client";

import * as React from "react";
import type { AreaRef } from "@/lib/areas";

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

"use client";

import * as React from "react";
import type { LifeArea } from "@/types/db";
import { AREA_PROJECT_IDS } from "@/lib/life";

type AreaIds = Record<LifeArea, string>;

const AreaBucketsContext = React.createContext<AreaIds>(AREA_PROJECT_IDS);

export function AreaBucketsProvider({
  ids,
  children,
}: {
  ids: AreaIds;
  children: React.ReactNode;
}) {
  return (
    <AreaBucketsContext.Provider value={ids}>
      {children}
    </AreaBucketsContext.Provider>
  );
}

export function useAreaBuckets(): AreaIds {
  return React.useContext(AreaBucketsContext);
}

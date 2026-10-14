"use client";

import { Select } from "@/components/ui-kit/forms/select";
import {
  areaFilterOptions,
  areaFilterOptionsFromAreas,
  isAreaBucketId,
  isLifeAreaValue,
  pathFilterOptions,
  pathFilterOptionsForAreaId,
} from "@/lib/project-namespace";
import { useActiveMemberAreas } from "@/components/member-areas-provider";
import type { LifeArea } from "@/types/db";

type ProjectRef = {
  id: string;
  name: string;
  area?: LifeArea | string | null;
  areaId?: string | null;
};

export function AreaPathFilters({
  projects,
  area,
  project,
  language,
  labels,
  onChange,
}: {
  projects: ProjectRef[];
  area: string;
  project: string;
  language: "FA" | "EN";
  labels: { area: string; path: string; allAreas: string; allPaths: string };
  onChange: (next: { area: string; project: string }) => void;
}) {
  const memberAreas = useActiveMemberAreas();
  const useDynamic = memberAreas.length > 0;

  const areaValue = useDynamic
    ? area
    : isLifeAreaValue(area)
      ? area
      : "";

  const areas = useDynamic
    ? areaFilterOptionsFromAreas(memberAreas, language, labels.allAreas)
    : areaFilterOptions(projects, language, labels.allAreas);

  const legacyArea: LifeArea | "" = isLifeAreaValue(area) ? area : "";
  const dynamicRef = useDynamic
    ? memberAreas.find(a => a.id === area)
    : undefined;
  const paths = [
    { value: "", label: labels.allPaths },
    ...(useDynamic && area
      ? pathFilterOptionsForAreaId(
          projects,
          language,
          area,
          dynamicRef?.legacyEnum ?? null,
        )
      : pathFilterOptions(projects, language, legacyArea)),
  ];

  function changeArea(value: string) {
    if (useDynamic) {
      const ref = memberAreas.find(a => a.id === value);
      const current = projects.find(item => item.id === project);
      const keep =
        !!current &&
        !isAreaBucketId(current.id) &&
        (!value ||
          current.areaId === value ||
          (!!ref?.legacyEnum && current.area === ref.legacyEnum));
      onChange({ area: value, project: keep ? project : "" });
      return;
    }
    const nextArea: LifeArea | "" = isLifeAreaValue(value) ? value : "";
    const current = projects.find(item => item.id === project);
    const keep =
      !!current &&
      !isAreaBucketId(current.id) &&
      (!nextArea || current.area === nextArea);
    onChange({ area: nextArea, project: keep ? project : "" });
  }

  function changePath(value: string) {
    if (!value) {
      onChange({ area: areaValue, project: "" });
      return;
    }
    const path = projects.find(item => item.id === value);
    if (useDynamic) {
      const areaId =
        path?.areaId ??
        memberAreas.find(a => a.legacyEnum === path?.area)?.id ??
        areaValue;
      onChange({ area: areaId, project: value });
      return;
    }
    const pathArea = isLifeAreaValue(path?.area) ? path.area : legacyArea;
    onChange({ area: pathArea, project: value });
  }

  return (
    <>
      <div className="w-full lg:w-40">
        <Select
          label={labels.area}
          value={areas.some(o => o.value === areaValue) ? areaValue : ""}
          onChange={changeArea}
          options={areas}
        />
      </div>
      <div className="w-full lg:w-48">
        <Select
          label={labels.path}
          value={paths.some(item => item.value === project) ? project : ""}
          onChange={changePath}
          options={paths}
        />
      </div>
    </>
  );
}

"use client";

import { Select } from "@/components/ui-kit/forms/select";
import {
  areaFilterOptions,
  isAreaBucketId,
  isLifeAreaValue,
  pathFilterOptions,
} from "@/lib/project-namespace";
import type { LifeArea } from "@/types/db";

type ProjectRef = { id: string; name: string; area?: LifeArea | string | null };

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
  const areaValue: LifeArea | "" = isLifeAreaValue(area) ? area : "";
  const areas = areaFilterOptions(projects, language, labels.allAreas);
  const paths = [
    { value: "", label: labels.allPaths },
    ...pathFilterOptions(projects, language, areaValue),
  ];

  function changeArea(value: string) {
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
    const pathArea = isLifeAreaValue(path?.area) ? path.area : areaValue;
    onChange({ area: pathArea, project: value });
  }

  return (
    <>
      <div className="w-full lg:w-40">
        <Select label={labels.area} value={areaValue} onChange={changeArea} options={areas} />
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

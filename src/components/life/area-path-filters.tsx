"use client";

import { Select } from "@/components/ui-kit/forms/select";
import {
  areaFilterOptionsFromAreas,
  isAreaBucketId,
  pathFilterOptionsForAreaId,
} from "@/lib/project-namespace";
import { useActiveMemberAreas } from "@/components/member-areas-provider";

type ProjectRef = {
  id: string;
  name: string;
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
  /** UserArea id; empty = all areas. */
  area: string;
  project: string;
  language: "FA" | "EN";
  labels: { area: string; path: string; allAreas: string; allPaths: string };
  onChange: (next: { area: string; project: string }) => void;
}) {
  const memberAreas = useActiveMemberAreas();

  const areas = areaFilterOptionsFromAreas(
    memberAreas,
    language,
    labels.allAreas,
  );
  const areaValue = areas.some(o => o.value === area) ? area : "";

  const pathOptions = areaValue
    ? pathFilterOptionsForAreaId(projects, language, areaValue)
    : projects
        .filter(item => !isAreaBucketId(item.id))
        .sort((a, b) =>
          a.name.localeCompare(b.name, language === "EN" ? "en" : "fa"),
        )
        .map(item => ({ value: item.id, label: item.name }));
  const paths = [{ value: "", label: labels.allPaths }, ...pathOptions];

  function changeArea(value: string) {
    const current = projects.find(item => item.id === project);
    const keep =
      !!current &&
      !isAreaBucketId(current.id) &&
      (!value || current.areaId === value);
    onChange({ area: value, project: keep ? project : "" });
  }

  function changePath(value: string) {
    if (!value) {
      onChange({ area: areaValue, project: "" });
      return;
    }
    const path = projects.find(item => item.id === value);
    onChange({ area: path?.areaId ?? areaValue, project: value });
  }

  return (
    <>
      <div className="w-full lg:w-40">
        <Select
          label={labels.area}
          value={areaValue}
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

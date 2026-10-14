import {
  allLegacyBucketIds,
  areaWhere,
  hubTaskExclusion,
  isAreaBucketId,
  isHubAreaId,
  seedKeyFromBucketId,
  areaTemplateMeta,
  templateKeyForSlug,
  areaRefForTemplate,
  personalAreaProjectId,
  type MemberContext,
} from "@/lib/areas";

export type ProjectKind = "bucket" | "path" | "workspace";

export type ProjectListScope =
  | "workspace"
  | "life"
  | "research"
  | "language"
  | "assignable"
  | "all";

export {
  isHubAreaId,
  isAreaBucketId,
  personalAreaProjectId,
  seedKeyFromBucketId,
};

/** bucket | hub path | workspace path, from the project's area and the member's hubs. */
export function projectKind(
  project: { id: string; areaId: string | null | undefined },
  ctx: Pick<MemberContext, "hubAreas">,
): ProjectKind {
  if (isAreaBucketId(project.id)) return "bucket";
  if (isHubAreaId(project.areaId, ctx)) return "path";
  return "workspace";
}

export function projectPickerLabel(
  project: { id: string; name: string },
  language: "FA" | "EN" = "FA",
): string {
  if (isAreaBucketId(project.id)) {
    const trimmed = project.name?.trim();
    if (trimmed) return trimmed;
    const meta = areaTemplateMeta(seedKeyFromBucketId(project.id) ?? "life");
    if (meta) return language === "EN" ? meta.nameEn : meta.nameFa;
  }
  return project.name;
}

/**
 * Prisma `where` fragment: projects visible for a list scope (membership applied
 * by caller). Hub scopes follow the member's hub areas (docs/AREAS.md §10.6/§10.7).
 */
export function projectWhereForScope(
  scope: ProjectListScope,
  ctx: Pick<MemberContext, "areas" | "hubAreas">,
): Record<string, unknown> {
  if (scope === "all") return {};

  if (scope === "research") {
    const id = ctx.hubAreas.research?.id;
    return id ? { areaId: id } : { id: "__never__" };
  }

  if (scope === "language") {
    const id = ctx.hubAreas.language?.id;
    return id ? { areaId: id } : { id: "__never__" };
  }

  const legacy = allLegacyBucketIds();
  const workspaceAreaIds = ctx.areas.filter(a => !a.hubFor).map(a => a.id);
  const bucketIds = ctx.areas
    .map(a => a.bucketProjectId)
    .filter((id): id is string => Boolean(id));

  if (scope === "workspace") {
    return {
      areaId: { in: workspaceAreaIds },
      AND: [
        { id: { notIn: [...legacy, ...bucketIds] } },
        { NOT: { id: { startsWith: "area-" } } },
      ],
    };
  }

  if (scope === "life") {
    return {
      OR: [
        { id: { in: legacy } },
        { id: { startsWith: "area-" } },
        { areaId: { in: workspaceAreaIds } },
      ],
    };
  }

  if (scope === "assignable") {
    return {};
  }

  return {};
}

/** Hub-task exclusion for a viewer (see `hubTaskExclusion`). */
export function taskWhereExcludeHub(
  ctx: Parameters<typeof hubTaskExclusion>[0],
): Record<string, unknown> {
  return hubTaskExclusion(ctx);
}

/** Prisma fragment: filter tasks by UserArea id (own area or its project's). */
export function areaScopeWhere(areaId: string): Record<string, unknown> {
  return areaWhere(areaId);
}

type MemberAreaKey = {
  id: string;
  templateKey?: string | null;
  hubFor?: "research" | "language" | null;
};

/**
 * Normalise a `?area=` value: a UserArea id passes through; a legacy slug from an
 * old bookmark (`phd|work|life|lang`, any case) maps through `templateKey`.
 */
export function normalizeAreaParam(
  raw: string,
  memberAreas: readonly MemberAreaKey[] = [],
): string {
  const value = raw.trim();
  if (!value || memberAreas.some(a => a.id === value)) return value;
  const key = templateKeyForSlug(value);
  if (!key) return value;
  const hit = areaRefForTemplate(
    memberAreas.map(a => ({
      id: a.id,
      templateKey: a.templateKey ?? null,
      hubFor: a.hubFor ?? null,
      archived: false,
    })),
    key,
  );
  return hit?.id ?? value;
}

/** Turn `?area=` and `?project=` into an area id plus named path. */
export function scopeFromFilters(
  areaParam: string,
  projectParam: string,
  projects: { id: string; areaId?: string | null }[] = [],
  memberAreas: readonly MemberAreaKey[] = [],
): { area: string; projectId: string } {
  const ids = projectParam.split(",").map(id => id.trim()).filter(Boolean);
  const pathId = ids.find(id => !isAreaBucketId(id)) ?? "";
  const bucketId = ids.find(id => isAreaBucketId(id));
  let area = normalizeAreaParam(areaParam, memberAreas);
  if (!area && !pathId && bucketId) {
    const bucket = projects.find(p => p.id === bucketId);
    area = bucket?.areaId ?? "";
  }
  if (pathId) {
    const path = projects.find(item => item.id === pathId);
    if (area) {
      if (path?.areaId && path.areaId !== area) {
        return { area, projectId: "" };
      }
    } else {
      area = path?.areaId ?? "";
    }
  }
  return { area, projectId: pathId };
}

/** Filter options from the member's UserAreas (value = areaId). */
export function areaFilterOptionsFromAreas(
  areas: { id: string; nameFa: string; nameEn: string; archived?: boolean }[],
  language: "FA" | "EN",
  allLabel: string,
): { value: string; label: string }[] {
  return [
    { value: "", label: allLabel },
    ...areas
      .filter(a => !a.archived)
      .map(a => ({
        value: a.id,
        label: language === "EN" ? a.nameEn || a.nameFa : a.nameFa || a.nameEn,
      })),
  ];
}

export function pathFilterOptionsForAreaId(
  projects: {
    id: string;
    name: string;
    areaId?: string | null;
  }[],
  language: "FA" | "EN",
  areaId: string,
): { value: string; label: string }[] {
  const paths = projects.filter(item => !isAreaBucketId(item.id));
  const visible = paths.filter(item => item.areaId === areaId);
  return [...visible]
    .sort((a, b) => a.name.localeCompare(b.name, language === "EN" ? "en" : "fa"))
    .map(item => ({ value: item.id, label: item.name }));
}

export function withCurrentProjectOption(
  options: { value: string; label: string }[],
  current?: { id: string; name: string } | null,
): { value: string; label: string }[] {
  if (!current?.id) return options;
  if (options.some(o => o.value === current.id)) return options;
  return [...options, { value: current.id, label: current.name }];
}

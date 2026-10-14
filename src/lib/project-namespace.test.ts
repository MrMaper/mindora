import { describe, expect, it } from "vitest";
import { normalizeAreaParam, scopeFromFilters } from "./project-namespace";

const projects = [
  { id: "area-life-u1", name: "زندگی", areaId: "a-life" },
  { id: "area-phd-u1", name: "دکتری", areaId: "a-phd" },
  { id: "path-stt", name: "STT Benchmark", areaId: "a-phd" },
  { id: "path-home", name: "خانه", areaId: "a-life" },
];

const memberAreas = [
  { id: "a-life", templateKey: "life", hubFor: null },
  { id: "a-work", templateKey: "work", hubFor: null },
  { id: "a-phd", templateKey: "research", hubFor: "research" as const },
  { id: "a-lang", templateKey: "language", hubFor: "language" as const },
];

describe("scopeFromFilters", () => {
  it("treats an area bucket as the whole area, not a path", () => {
    expect(scopeFromFilters("", "area-life-u1", projects)).toEqual({
      area: "a-life",
      projectId: "",
    });
  });

  it("keeps a named path and fills its area", () => {
    expect(scopeFromFilters("", "path-stt", projects)).toEqual({
      area: "a-phd",
      projectId: "path-stt",
    });
  });

  it("drops a path that sits in another area", () => {
    expect(scopeFromFilters("a-life", "path-stt", projects)).toEqual({
      area: "a-life",
      projectId: "",
    });
  });

  it("maps a legacy ?area=PHD bookmark through the member's templateKey", () => {
    expect(scopeFromFilters("PHD", "", projects, memberAreas)).toEqual({
      area: "a-phd",
      projectId: "",
    });
  });
});

describe("normalizeAreaParam", () => {
  it("passes ids through and maps legacy slugs via templateKey/hubFor", () => {
    expect(normalizeAreaParam("a-work", memberAreas)).toBe("a-work");
    expect(normalizeAreaParam("phd", memberAreas)).toBe("a-phd");
    expect(normalizeAreaParam("LANG", memberAreas)).toBe("a-lang");
    expect(normalizeAreaParam("life", memberAreas)).toBe("a-life");
    expect(normalizeAreaParam("", memberAreas)).toBe("");
    expect(normalizeAreaParam("unknown", memberAreas)).toBe("unknown");
  });
});

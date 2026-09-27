import { describe, expect, it } from "vitest";
import { scopeFromFilters } from "./project-namespace";

const projects = [
  { id: "area-life-u1", name: "زندگی", area: "LIFE" },
  { id: "area-phd-u1", name: "دکتری", area: "PHD" },
  { id: "path-stt", name: "STT Benchmark", area: "PHD" },
  { id: "path-home", name: "خانه", area: "LIFE" },
];

describe("scopeFromFilters", () => {
  it("treats an area bucket as the whole area, not a path", () => {
    expect(scopeFromFilters("", "area-life-u1", projects)).toEqual({
      area: "LIFE",
      projectId: "",
    });
  });

  it("keeps a named path and fills its area", () => {
    expect(scopeFromFilters("", "path-stt", projects)).toEqual({
      area: "PHD",
      projectId: "path-stt",
    });
  });

  it("drops a path that sits in another area", () => {
    expect(scopeFromFilters("LIFE", "path-stt", projects)).toEqual({
      area: "LIFE",
      projectId: "",
    });
  });
});

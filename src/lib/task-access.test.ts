import { describe, expect, it } from "vitest";
import {
  canAccessPersonalTask,
  personalLifeTaskWhere,
  personalTaskOwnership,
} from "@/lib/task-access";

describe("personalTaskOwnership", () => {
  it("scopes to assignee or unassigned creator", () => {
    expect(personalTaskOwnership("u1")).toEqual({
      OR: [
        { assignedToId: "u1" },
        { createdById: "u1", assignedToId: null },
      ],
    });
  });
});

describe("personalLifeTaskWhere", () => {
  it("nests ownership under AND so extra OR filters cannot overwrite it", () => {
    const where = personalLifeTaskWhere("u1");
    expect(where).toHaveProperty("AND");
    expect(Array.isArray(where.AND)).toBe(true);
    expect(where.AND[0]).toEqual(personalTaskOwnership("u1"));
    // Simulated picker where — same shape as focus candidates
    const pickerWhere = {
      AND: [
        where,
        { status: { not: "DONE" } },
        { OR: [{ dueDate: null }, { dueDate: { lte: new Date() } }] },
      ],
    };
    const and = pickerWhere.AND as unknown[];
    expect(and[0]).toEqual(where);
    expect(JSON.stringify(and[0])).toContain("assignedToId");
  });
});

describe("canAccessPersonalTask", () => {
  it("allows admin always", () => {
    expect(
      canAccessPersonalTask("u1", "ADMIN", {
        assignedToId: "other",
        createdById: "other",
      }),
    ).toBe(true);
  });

  it("allows assignee", () => {
    expect(
      canAccessPersonalTask("u1", "MEMBER", {
        assignedToId: "u1",
        createdById: "other",
      }),
    ).toBe(true);
  });

  it("allows unassigned creator", () => {
    expect(
      canAccessPersonalTask("u1", "MEMBER", {
        assignedToId: null,
        createdById: "u1",
      }),
    ).toBe(true);
  });

  it("denies other users", () => {
    expect(
      canAccessPersonalTask("u1", "MEMBER", {
        assignedToId: "u2",
        createdById: "u2",
      }),
    ).toBe(false);
  });
});

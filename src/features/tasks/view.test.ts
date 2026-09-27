import { describe, expect, it } from "vitest";
import type { TaskRow } from "./types";
import { compareTasks, groupTasks, TASK_GROUP_NONE } from "./view";

function row(partial: Partial<TaskRow> & Pick<TaskRow, "id" | "title">): TaskRow {
  return {
    status: "TODO",
    priority: "NONE",
    type: "TASK",
    dueDate: null,
    position: 0,
    createdAt: new Date("2026-09-01T12:00:00"),
    updatedAt: new Date("2026-09-01T12:00:00"),
    createdBy: { id: "u", name: "u", avatar: null },
    assignedTo: null,
    labels: [],
    projectId: null,
    projectName: null,
    area: "LIFE",
    ...partial,
  };
}

describe("compareTasks", () => {
  it("sorts priority by urgency, not alphabet", () => {
    const tasks = [
      row({ id: "1", title: "a", priority: "NONE" }),
      row({ id: "2", title: "b", priority: "URGENT" }),
      row({ id: "3", title: "c", priority: "HIGH" }),
    ].sort((a, b) => compareTasks(a, b, "priority", "asc"));
    expect(tasks.map(task => task.priority)).toEqual(["URGENT", "HIGH", "NONE"]);
  });

  it("keeps tasks without a due date at the end", () => {
    const tasks = [
      row({ id: "1", title: "none" }),
      row({ id: "2", title: "later", dueDate: new Date("2026-09-28T12:00:00") }),
      row({ id: "3", title: "sooner", dueDate: new Date("2026-09-27T12:00:00") }),
    ].sort((a, b) => compareTasks(a, b, "dueDate", "asc"));
    expect(tasks.map(task => task.title)).toEqual(["sooner", "later", "none"]);
  });

  it("sorts named paths and leaves area buckets last", () => {
    const tasks = [
      row({ id: "1", title: "bucket", projectId: "area-life-u1", projectName: "زندگی" }),
      row({ id: "2", title: "beta", projectId: "p2", projectName: "ب" }),
      row({ id: "3", title: "alpha", projectId: "p1", projectName: "الف" }),
    ].sort((a, b) => compareTasks(a, b, "project", "asc"));
    expect(tasks.map(task => task.title)).toEqual(["alpha", "beta", "bucket"]);
  });
});

describe("groupTasks", () => {
  const tasks = [
    row({ id: "1", title: "sleep", status: "TODO", area: "LIFE", dueDate: new Date("2026-09-28T12:00:00") }),
    row({
      id: "2",
      title: "paper",
      status: "BACKLOG",
      area: "PHD",
      projectId: "path-1",
      projectName: "فصل ۳",
    }),
    row({ id: "3", title: "inbox", status: "BACKLOG", area: "LIFE", projectId: "area-life-u1", projectName: "زندگی" }),
  ];

  it("groups by status in workflow order", () => {
    const groups = groupTasks(tasks, "status");
    expect(groups.map(group => group.key)).toEqual(["BACKLOG", "TODO"]);
    expect(groups[0]?.tasks).toHaveLength(2);
  });

  it("puts tasks without a named path in one group", () => {
    const groups = groupTasks(tasks, "path");
    expect(groups.map(group => group.key)).toEqual(["path-1", TASK_GROUP_NONE]);
  });

  it("groups by area with the fixed area order", () => {
    const groups = groupTasks(tasks, "area");
    expect(groups.map(group => group.key)).toEqual(["PHD", "LIFE"]);
  });
});

# Multiple Assignees Per Task Migration Plan

## Overview
Enable tasks (TASK, STORY, BUG, EPIC) to have multiple assignees instead of a single assignee.

---

## Phase 1: Database Schema Migration

### Objectives
- Replace single `assignedToId` with many-to-many relationship
- Maintain data integrity during migration
- Preserve existing assignee data

### Steps

#### 1.1 Add TaskAssignee Join Model
```prisma
model TaskAssignee {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@unique([taskId, userId])
  @@map("task_assignees")
}
```

#### 1.2 Update Task Model
- Remove: `assignedToId String?`
- Remove: `assignedTo User? @relation("TaskAssignedTo", fields: [assignedToId], references: [id])`
- Add: `assignees TaskAssignee[]`

#### 1.3 Update User Model
- Add: `assignedTasks TaskAssignee[]`

#### 1.4 Create Migration
```bash
npx prisma migrate dev --name add_task_assignees
```

#### 1.5 Backfill Script (run in migration or separate script)
```typescript
// For each task with assignedToId:
await db.taskAssignee.create({
  data: {
    taskId: task.id,
    userId: task.assignedToId,
  }
})
```

#### 1.6 Drop Old Column
```sql
-- After backfill verification
ALTER TABLE "tasks" DROP COLUMN "assignedToId";
```

### Cautions
- ⚠️ **Run backfill BEFORE dropping column** - verify all assignees migrated
- ⚠️ Test migration on staging with production-like data volume
- ⚠️ Ensure unique constraint on `[taskId, userId]` prevents duplicates
- ⚠️ Consider index on `userId` for "my tasks" queries

---

## Phase 2: Type Definitions

### Objectives
- Update TypeScript types to reflect array-based assignees
- Maintain type safety across codebase

### Steps

#### 2.1 Update `features/tasks/types.ts`
```typescript
export interface TaskRow {
  // ... existing fields
  assignees: TaskUserRef[];  // was: assignedTo: TaskUserRef | null
}

export interface GetTasksParams {
  // ... existing fields
  assigneeIds?: string[];  // was: assigneeId?: string
}
```

#### 2.2 Update Related Types
- `TaskDetail` (extends TaskRow)
- Any API response types using assignees

### Cautions
- ⚠️ Search for all usages of `assignedTo` in codebase (grep)
- ⚠️ Update `TaskUserRef` if additional fields needed (role on task, etc.)

---

## Phase 3: Queries Layer

### Objectives
- Fetch assignees array instead of single assignee
- Update filtering to support multiple assignees

### Steps

#### 3.1 Update `toTaskRow()` Helper (`features/tasks/queries.ts`)
```typescript
function toTaskRow(task: any): TaskRow {
  return {
    // ... existing fields
    assignees: task.assignees?.map((a: any) => ({
      id: a.user.id,
      name: a.user.name,
      avatar: a.user.avatar,
    })) ?? [],
  };
}
```

#### 3.2 Update `getTasks()`
- Select: `assignees: { select: { user: { select: userRefSelect } } }`
- Filter: `assignees: { some: { userId: { in: params.assigneeIds } } }`

#### 3.3 Update `getTaskById()` / `getTaskDetailAction()`
- Same select pattern as getTasks

### Cautions
- ⚠️ Use `some` for OR logic (task matches if ANY assignee in list)
- ⚠️ Use `every` if filtering for tasks where ALL assignees match (rare)
- ⚠️ Performance: add index on `TaskAssignee.userId` if not present

---

## Phase 4: Actions Layer

### Objectives
- Create/update tasks with multiple assignees
- Handle authorization for multiple assignees
- Send notifications to all assignees

### Steps

#### 4.1 Create Task (`createTask` in `features/tasks/actions.ts`)
```typescript
// Input: assignedToIds: string[]
const task = await db.task.create({
  data: {
    // ... other fields
    assignees: {
      create: assignedToIds.map(userId => ({ userId }))
    }
  }
});

// Notify all assignees
for (const assigneeId of assignedToIds) {
  if (assigneeId !== session.user.id) {
    await notify({ userId: assigneeId, ... });
  }
}
```

#### 4.2 Update Task (`updateTask`)
```typescript
const currentAssigneeIds = existing.assignees.map(a => a.userId);
const nextAssigneeIds = parsed.data.assignedToIds ?? [];

// Diff arrays
const toAdd = nextAssigneeIds.filter(id => !currentAssigneeIds.includes(id));
const toRemove = currentAssigneeIds.filter(id => !nextAssigneeIds.includes(id));

await db.task.update({
  where: { id },
  data: {
    // ... other fields
    assignees: {
      deleteMany: { userId: { in: toRemove } },
      create: toAdd.map(userId => ({ userId })),
    }
  }
});

// Notify new assignees only
for (const assigneeId of toAdd) {
  if (assigneeId !== session.user.id) {
    await notify({ userId: assigneeId, type: "TASK_ASSIGNED", ... });
  }
}
```

#### 4.3 Authorization
```typescript
const isAssignee = existing.assignees.some(a => a.userId === session.user.id);
const isAdmin = session.user.role === "ADMIN";
if (!isAdmin && !isAssignee) {
  return { success: false, error: "Only assignees or admins can edit." };
}
```

#### 4.4 Status Change / Drag-Drop
- Check if user is in `task.assignees`
- Notify ALL assignees on status change

### Cautions
- ⚠️ **Transactional integrity**: Wrap create/update in `db.$transaction` if multiple operations
- ⚠️ **Notification deduplication**: Don't notify same user twice if they're in multiple roles
- ⚠️ **Self-assignment**: Don't notify the user making the change
- ⚠️ **Empty array**: Handle `assignedToIds: []` (unassign all) vs `undefined` (no change)

---

## Phase 5: Schemas & Validation

### Objectives
- Validate array of assignee IDs
- Maintain backward-compatible API where possible

### Steps

#### 5.1 Update `schemas/tasks.ts`
```typescript
export const createTaskSchema = z.object({
  // ... existing fields
  assignedToIds: z.string().array().optional().default([]),  // was assignedToId
  // ... rest
});

export const updateTaskSchema = createTaskSchema.partial();
```

### Cautions
- ⚠️ Ensure empty array is valid (unassign all)
- ⚠️ Validate user IDs exist in database (optional: custom refinement)
- ⚠️ Max assignees limit? (e.g., max 10 per task)

---

## Phase 6: UI Components

### Objectives
- Replace single-select with multi-select for assignees
- Display multiple assignees in tables and cards

### Steps

#### 6.1 Create/Edit Task Drawers
- Replace `Select` with multi-select component
- Show user avatars + names in dropdown
- Selected: avatar stack in trigger

#### 6.2 Task Filters (Tasks & Kanban)
- Multi-select for assignee filter
- URL param: `assignee=id1,id2,id3` (comma-separated)

#### 6.3 Task Table (`tasks-table.tsx`)
- Column: stack avatars (max 3 visible, "+N" badge)
- Tooltip: list all assignee names

#### 6.4 Kanban Card (`kanban-card.tsx`)
- Avatar stack in footer (max 2, "+N")
- Tooltip on hover

#### 6.5 Activity Log
- "assigned" action: show all assignees added/removed
- Format: "assigned User A, User B"

### Cautions
- ⚠️ **Avatar stack component**: Create reusable `AvatarStack` in ui-kit/data-display
- ⚠️ **URL length**: Comma-separated IDs in URL params - watch for 2048 char limit
- ⚠️ **Accessibility**: Multi-select must be keyboard navigable
- ⚠️ **Performance**: Virtualize user list if >100 users

---

## Phase 7: API & Integration Points

### Objectives
- Ensure all API endpoints handle array format
- Update any external integrations

### Steps
- Check `features/tasks/actions.ts` for any returned `assignedToId` in responses
- Update `getTaskDetailAction` return type
- Verify webhook/event payloads if any

### Cautions
- ⚠️ Mobile app / third-party consumers may break - version API if needed
- ⚠️ Export/import features (CSV, etc.)

---

## Phase 8: Testing & Verification

### Test Cases
| Scenario | Expected |
|----------|----------|
| Create task with 0 assignees | Success, no notifications |
| Create task with 1 assignee | Success, 1 notification |
| Create task with 3 assignees | Success, 3 notifications |
| Update: add assignee | Notify new assignee only |
| Update: remove assignee | No notification to removed |
| Update: replace all | Notify new, not old |
| Filter by assignee (multi) | OR logic - show if ANY match |
| "My Tasks" view | Show if user in assignees array |
| Drag-drop by non-assignee | Blocked (unless admin) |
| Drag-drop by one of multiple assignees | Allowed |
| Archive/restore project | Preserve assignees |

### Cautions
- ⚠️ Test with 0, 1, and N assignees
- ⚠️ Test concurrent edits (race conditions on assignee array)
- ⚠️ Load test: 1000 tasks × 5 assignees = 5000 join rows

---

## Phase 9: Documentation & Rollout

### Steps
- Update API docs (if OpenAPI/Swagger)
- Update user guide / help center
- Changelog entry
- Feature flag for gradual rollout (optional)

### Cautions
- ⚠️ Communicate breaking change to API consumers
- ⚠️ Provide migration guide for custom integrations

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss during migration | Low | High | Backfill verification, staging test |
| Performance regression | Medium | Medium | Add indexes, monitor query plans |
| Authorization bypass | Low | High | Comprehensive test coverage |
| Notification spam | Medium | Medium | Deduplicate, respect preferences |
| UI/UX confusion | Medium | Low | User testing, clear avatar stack |

---

## Rollback Plan

If critical issues arise post-deploy:
1. Revert code deployment
2. Run reverse migration (restore `assignedToId` column from `TaskAssignee` - pick first assignee)
3. Note: Data loss for tasks with >1 assignee (only first preserved)

---

## Estimated Effort

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Database | 2-4 hours |
| Phase 2: Types | 1 hour |
| Phase 3: Queries | 2-3 hours |
| Phase 4: Actions | 3-4 hours |
| Phase 5: Schemas | 30 min |
| Phase 6: UI | 4-6 hours |
| Phase 7: API | 1 hour |
| Phase 8: Testing | 2-3 hours |
| Phase 9: Docs | 1 hour |
| **Total** | **16-25 hours** |

---

## Dependencies
- Prisma migration tool
- Multi-select component (may need to build or add library)
- Avatar stack component (build in ui-kit)
- Notification system (existing)

---

## Sign-off Required
- [ ] Database migration reviewed by DBA/lead
- [ ] API contract changes documented
- [ ] UI/UX design approved for multi-select + avatar stack
- [ ] Test plan reviewed by QA
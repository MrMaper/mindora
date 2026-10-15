export type ProjectStatus =
  | "ACTIVE"
  | "ARCHIVED"
  | "ON_HOLD"
  | "PLANNED"
  | "COMPLETED";

export interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  /** UserArea id this path belongs to. */
  areaId: string;
  teamId: string | null;
  teamName: string | null;
  memberCount: number;
  createdAt: Date;
  pinned: boolean;
  sortOrder: number;
  /** Hub list stats (optional; filled by getProjectsHub). */
  openTaskCount?: number;
  doneTaskCount?: number;
  totalTaskCount?: number;
  nextActionTitle?: string | null;
}

export interface GetProjectsResult {
  projects: ProjectRow[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AreaPrefRow {
  areaId: string;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  archived: boolean;
}

export interface AreaHubSection {
  areaId: string;
  /** Template hint (palette / names); never an identity. */
  templateKey: string | null;
  /** Still showing seed template name (and default slogan localization). */
  nameIsDefault: boolean;
  displayName: string;
  hubFor: "research" | "language" | null;
  isDefault: boolean;
  bucket: ProjectRow;
  paths: ProjectRow[];
  /** Open (non-DONE) tasks across bucket + paths in this area. */
  openTaskCount: number;
  activePathCount: number;
  pref: AreaPrefRow;
}

export interface ProjectsHubData {
  sections: AreaHubSection[];
  /** Paths where the member is a guest (S-10). */
  sharedPaths: ProjectRow[];
  search: string;
  /** Pinned paths across all areas (for shortcuts). */
  pinnedPaths: ProjectRow[];
}

export interface AreaDashboardData {
  areaId: string;
  templateKey: string | null;
  nameIsDefault: boolean;
  displayName: string;
  hubFor: "research" | "language" | null;
  isDefault: boolean;
  bucket: ProjectRow;
  pref: AreaPrefRow;
  paths: ProjectRow[];
  openTaskCount: number;
  doneTaskCount: number;
  activePathCount: number;
  /** Open tasks due or updated this week (for “this week” strip). */
  weekOpenTasks: {
    id: string;
    title: string;
    status: string;
    dueDate: Date | null;
    projectId: string | null;
    projectName: string | null;
  }[];
  nextActions: { pathId: string; pathName: string; title: string }[];
  /** Soft metrics */
  stats: {
    pathsTotal: number;
    pathsCompleted: number;
    pathsOnHold: number;
    tasksOpen: number;
    tasksDone: number;
  };
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  areaId: string;
  teamId: string | null;
  teamName: string | null;
  createdAt: Date;
  updatedAt: Date;
  pinned: boolean;
  sortOrder: number;
  members: ProjectMemberRow[];
  _count: {
    tasks: number;
    sprints: number;
    members: number;
  };
}

export interface ProjectMemberRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  joinedAt: Date;
}

export interface ProjectTaskRow {
  id: string;
  title: string;
  description: string | null;
  status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "REVIEW" | "TESTING" | "BLOCKED";
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
  type: "TASK" | "STORY" | "BUG" | "EPIC";
  storyPoints: number | null;
  dueDate: Date | null;
  assignee: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectActivityRow {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  performedBy: {
    id: string;
    name: string;
    avatar: string | null;
  };
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  timestamp: Date;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  teamId: string;
}

export interface UpdateProjectInput {
  name: string;
  description?: string;
}

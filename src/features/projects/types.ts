export interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "ARCHIVED" | "ON_HOLD";
  teamId: string | null;
  teamName: string | null;
  memberCount: number;
  createdAt: Date;
}

export interface GetProjectsResult {
  projects: ProjectRow[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "ARCHIVED" | "ON_HOLD";
  teamId: string | null;
  teamName: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "REVIEW" | "TESTING" | "DONE" | "BLOCKED";
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
export interface TeamRow {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: Date;
}

export interface GetTeamsResult {
  teams: TeamRow[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TeamMemberRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  roleId: string;
  roleName: string;
  joinedAt: Date;
}

export interface TeamDetail {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  memberCount: number;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: Date;
  members: TeamMemberRow[];
}

export interface CreateTeamInput {
  name: string;
  description?: string;
}

export interface UpdateTeamInput {
  name: string;
  description?: string;
}
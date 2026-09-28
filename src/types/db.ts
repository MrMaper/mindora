// Central re-export of generated Prisma model types.
// Use these aliases everywhere instead of importing from prisma/generated directly.
export type {
  User,
  Task,
  Label,
  Comment,
  Attachment,
  Notification,
  ActivityLog,
  PasswordResetToken,
  UserPreferences,
  Doc,
} from "../../prisma/generated/client";

export type {
  UserRole,
  UserStatus,
  TaskStatus,
  TaskPriority,
  TaskType,
  NotificationType,
  Language,
  Theme,
  LifeArea,
  ProjectStatus,
  RecurrenceInterval,
  DocStatus,
  SourceReadingStatus,
  LangSkill,
  ExamKind,
  MockStatus,
} from "../../prisma/generated/enums";

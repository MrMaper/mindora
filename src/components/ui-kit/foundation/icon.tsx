import * as React from "react";
import {
  Home,
  Search,
  Bell,
  Settings,
  LayoutDashboard,
  Columns,
  List,
  Calendar,
  Inbox,
  FolderOpen,
  Users,
  UsersRound,
  User,
  BarChart3,
  Shield,
  Plus,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  MoreHorizontal,
  MoreVertical,
  Filter,
  SlidersHorizontal,
  Pencil,
  Trash2,
  Copy,
  Clock,
  Flag,
  MessageSquare,
  Paperclip,
  Link,
  AlertTriangle,
  Circle,
  CircleDot,
  CheckCircle,
  GitBranch,
  LogOut,
  Command,
  Moon,
  Sun,
  Target,
  Lock,
  Languages,
  Zap,
  Mail,
  Archive,
  RotateCcw,
} from "lucide-react";

export type IconName =
  | "home"
  | "search"
  | "archive"
  | "bell"
  | "settings"
  | "layout-dashboard"
  | "columns"
  | "list"
  | "calendar"
  | "inbox"
  | "folder"
  | "users"
  | "users-round"
  | "user"
  | "bar-chart"
  | "shield"
  | "plus"
  | "check"
  | "x"
  | "chevron-down"
  | "chevron-right"
  | "chevron-left"
  | "chevron-up"
  | "chevrons-up-down"
  | "arrow-up"
  | "arrow-down"
  | "arrow-right"
  | "arrow-left"
  | "more-horizontal"
  | "more-vertical"
  | "filter"
  | "sliders"
  | "pencil"
  | "trash"
  | "copy"
  | "clock"
  | "flag"
  | "message-square"
  | "paperclip"
  | "link"
  | "alert-triangle"
  | "circle"
  | "circle-dot"
  | "circle-check"
  | "git-branch"
  | "log-out"
  | "command"
  | "moon"
  | "sun"
  | "target"
  | "lock"
  | "language"
  | "zap"
  | "mail"
  | "rotate-ccw";

const iconMap: Record<IconName, React.ComponentType<React.SVGAttributes<SVGSVGElement>>> = {
  home: Home,
  search: Search,
  archive: Archive,
  bell: Bell,
  settings: Settings,
  "layout-dashboard": LayoutDashboard,
  columns: Columns,
  list: List,
  calendar: Calendar,
  inbox: Inbox,
  folder: FolderOpen,
  users: Users,
  "users-round": UsersRound,
  user: User,
  "bar-chart": BarChart3,
  shield: Shield,
  plus: Plus,
  check: Check,
  x: X,
  "chevron-down": ChevronDown,
  "chevron-right": ChevronRight,
  "chevron-left": ChevronLeft,
  "chevron-up": ChevronUp,
  "chevrons-up-down": ChevronsUpDown,
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,
  "arrow-right": ArrowRight,
  "arrow-left": ArrowLeft,
  "more-horizontal": MoreHorizontal,
  "more-vertical": MoreVertical,
  filter: Filter,
  sliders: SlidersHorizontal,
  pencil: Pencil,
  trash: Trash2,
  copy: Copy,
  clock: Clock,
  flag: Flag,
  "message-square": MessageSquare,
  paperclip: Paperclip,
  link: Link,
  "alert-triangle": AlertTriangle,
  circle: Circle,
  "circle-dot": CircleDot,
  "circle-check": CheckCircle,
  "git-branch": GitBranch,
  "log-out": LogOut,
  command: Command,
  moon: Moon,
  sun: Sun,
  target: Target,
  lock: Lock,
  language: Languages,
  zap: Zap,
  mail: Mail,
  "rotate-ccw": RotateCcw,
};

export interface IconProps extends Omit<React.SVGAttributes<SVGSVGElement>, "width" | "height"> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.75,
  className = "",
  style,
  ...rest
}: IconProps): React.JSX.Element | null {
  const LucideIcon = iconMap[name];
  if (!LucideIcon) {
    console.warn(`[ScrumFlow] Unknown icon: "${name}"`);
    return null;
  }
  return (
    <LucideIcon
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      className={className}
      style={{ flex: "none", display: "block", ...style }}
      aria-hidden="true"
      {...rest}
    />
  );
}
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
  UserCircle,
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
  GripVertical,
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
  UserX,
  RotateCcw,
  Eye,
  EyeOff,
  Bot,
  Send,
  FileText,
  Download,
  Info,
  Menu,
  Volume2,
} from "lucide-react";

const UsersConnected = (props: React.SVGAttributes<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="5" r="3" />
    <circle cx="5" cy="19" r="3" />
    <circle cx="19" cy="19" r="3" />
    <path d="M12 8v9" />
    <path d="M5 16h9" />
    <path d="M14 16h5" />
    <path d="M8 5l-5 14" />
    <path d="M16 5l5 14" />
  </svg>
);

export type IconName =
  | "home"
  | "search"
  | "archive"
  | "user-x"
  | "bell"
  | "eye"
  | "eyeOff"
  | "settings"
  | "layout-dashboard"
  | "columns"
  | "list"
  | "calendar"
  | "inbox"
  | "folder"
  | "users"
  | "users-round"
  | "users-connected"
  | "user"
  | "user-circle"
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
  | "grip-vertical"
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
  | "rotate-ccw"
  | "bot"
  | "send"
  | "file-text"
  | "download"
  | "info"
  | "menu"
  | "volume";

const iconMap: Record<
  IconName,
  React.ComponentType<React.SVGAttributes<SVGSVGElement>>
> = {
  home: Home,
  search: Search,
  archive: Archive,
  "user-x": UserX,
  bell: Bell,
  eye: Eye,
  eyeOff: EyeOff,
  settings: Settings,
  "layout-dashboard": LayoutDashboard,
  columns: Columns,
  list: List,
  calendar: Calendar,
  inbox: Inbox,
  folder: FolderOpen,
  users: Users,
  "users-round": UsersRound,
  "users-connected": UsersConnected,
  user: User,
  "user-circle": UserCircle,
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
  "grip-vertical": GripVertical,
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
  send: Send,
  bot: Bot,
  "file-text": FileText,
  download: Download,
  info: Info,
  menu: Menu,
  volume: Volume2,
};

export interface IconProps extends Omit<
  React.SVGAttributes<SVGSVGElement>,
  "width" | "height"
> {
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
    console.warn(`[Mindora] Unknown icon: "${name}"`);
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

import {
  CalendarBlank, ChatsCircle, Coins, FilmSlate, GameController, House, Lightbulb, Megaphone, PlayCircle, ShieldCheck, Sparkle, TreeStructure, UsersThree, ClockCounterClockwise, BellRinging,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import type { MessageKey } from "@/lib/i18n";

export interface NavItem { href: string; key: MessageKey; icon: Icon; exact?: boolean; center?: boolean }

/** Fan: exactly Home · Games · PR · Reels · Events, with PR centred. */
export const FAN_NAV: NavItem[] = [
  { href: "/", key: "nav.home", icon: House, exact: true },
  { href: "/games", key: "nav.games", icon: GameController },
  { href: "/pr", key: "nav.pr", icon: FilmSlate, center: true },
  { href: "/reels", key: "nav.reels", icon: PlayCircle },
  { href: "/events", key: "nav.events", icon: CalendarBlank },
];
/** Admin: exactly Home · Messages · PR · Events · Reels, with PR centred. */
export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", key: "nav.home", icon: House, exact: true },
  { href: "/admin/messages", key: "nav.messages", icon: ChatsCircle },
  { href: "/admin/pr", key: "nav.pr", icon: FilmSlate, center: true },
  { href: "/admin/events", key: "nav.events", icon: CalendarBlank },
  { href: "/admin/reels", key: "nav.reels", icon: PlayCircle },
];
/** Secondary admin workspace tools (sidebar group / mobile tools sheet). Not part of the primary five. */
export const ADMIN_TOOLS: NavItem[] = [
  { href: "/admin/moderation", key: "nav.moderation", icon: ShieldCheck },
  { href: "/admin/guardian", key: "nav.guardian", icon: Sparkle },
  { href: "/admin/members", key: "nav.members", icon: UsersThree },
  { href: "/admin/appointments", key: "nav.appointments", icon: TreeStructure },
  { href: "/admin/quiz-studio", key: "nav.quizStudio", icon: Lightbulb },
  { href: "/admin/announcements", key: "nav.announcements", icon: Megaphone },
  { href: "/admin/notifications", key: "nav.notificationsAdmin", icon: BellRinging },
  { href: "/admin/rewards", key: "nav.rewards", icon: Coins },
  { href: "/admin/activity", key: "nav.activity", icon: ClockCounterClockwise },
];
export const isActive = (pathname: string, item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/"));

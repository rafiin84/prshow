"use client";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Bell, FilmSlate, ListBullets, LockKey } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, Skeleton } from "@/components/ui/misc";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScopeBadge } from "@/components/ui/badge";
import { DemoButton, DemoPanel } from "./demo-panel";
import { ADMIN_NAV, ADMIN_TOOLS, FAN_NAV, isActive, type NavItem } from "./nav";
import { useSession } from "@/stores/session";
import { useApiQuery } from "@/lib/query";
import { admin as adminApi, fan as fanApi } from "@/lib/api";
import { findAC, findDistrict, findWard } from "@/data/seeds/locations";
import { ROLE_LABEL, scopeLabel } from "@/lib/permissions/policy";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SHARED = ["/profile", "/notifications", "/help"];
const isShared = (p: string) => SHARED.some((s) => p === s || p.startsWith(s + "/"));

export function AccessDenied() {
  const router = useRouter();
  const { role, switchRole } = useSession();
  return (
    <div className="mx-auto max-w-lg py-20 text-center" role="alert">
      <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-warning-soft text-warning"><LockKey className="size-8" weight="duotone" aria-hidden /></div>
      <h1 className="text-3xl font-semibold">{t("access.denied.title")}</h1>
      <p className="mt-3 text-muted-fg">{t("access.denied.body")}</p>
      <p className="mt-2 text-sm text-muted-fg">You&apos;re currently viewing as <strong>{ROLE_LABEL[role]}</strong>.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={() => router.replace(role === "fan" ? "/" : "/admin")}>Go to my home</Button>
        {role === "fan" && <Button variant="outline" onClick={() => { switchRole("ward"); router.replace("/admin"); }}>Switch to Ward Admin (demo)</Button>}
      </div>
    </div>
  );
}

function useIdentity() {
  const { userId, role } = useSession();
  return { userId, role, isAdmin: role !== "fan" };
}

function ProfileAvatar() {
  const { userId } = useIdentity();
  const q = useApiQuery(["me"], () => fanApi.getIdentity(userId!), !!userId);
  const p = q.data;
  return (
    <Link href="/profile" aria-label={t("nav.profile")} className="rounded-full ring-offset-2 ring-offset-bg transition-transform hover:scale-105">
      {p ? <Avatar name={p.name} hue={p.hue} size={38} /> : <Skeleton className="size-[38px] rounded-full" />}
    </Link>
  );
}

function BellLink() {
  const { userId } = useIdentity();
  const q = useApiQuery(["unread-notifs"], () => fanApi.unreadNotificationCount(userId!), !!userId);
  const n = q.data ?? 0;
  return (
    <Link href="/notifications" aria-label={n ? `${t("nav.notifications")}, ${n} unread` : t("nav.notifications")} className="relative grid size-10 place-items-center rounded-full text-fg hover:bg-muted">
      <Bell className="size-6" aria-hidden />
      {n > 0 && <span className="absolute top-1 right-1 grid min-w-[1.1rem] place-items-center rounded-full bg-accent px-1 text-[0.65rem] leading-[1.1rem] font-bold text-accent-fg">{n > 9 ? "9+" : n}</span>}
    </Link>
  );
}

function Logo({ admin }: { admin?: boolean }) {
  return (
    <Link href={admin ? "/admin" : "/"} className="flex items-center gap-2.5 rounded-full">
      <span className="grid size-9 place-items-center rounded-full bg-accent text-accent-fg"><FilmSlate weight="fill" className="size-5" aria-hidden /></span>
      <span className="leading-none"><span className="font-display text-lg font-bold">PR Show</span>{admin && <span className="block text-[0.65rem] font-semibold tracking-widest text-muted-fg uppercase">Admin</span>}</span>
    </Link>
  );
}

function useScopeText() {
  const { userId, role } = useIdentity();
  const q = useApiQuery(["scope"], async () => adminApi.needAdmin(userId!), !!userId && role !== "fan");
  if (!q.data) return "";
  const s = q.data.scope;
  return scopeLabel(s, { district: findDistrict(s.districtId)?.name, ac: findAC(s.acId)?.name, ward: findWard(s.wardId)?.name });
}

function DesktopTopNav({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
      <LayoutGroup id="topnav">
        {items.map((it) => {
          const active = isActive(pathname, it);
          const Icon = it.icon;
          return (
            <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined} className={cn("relative flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors", active ? "text-fg" : "text-muted-fg hover:text-fg", it.center && !active && "text-fg")}>
              {active && <motion.span layoutId="topnav-pill" className="absolute inset-0 rounded-full bg-muted" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <Icon weight={it.center || active ? "fill" : "regular"} className={cn("relative size-5", it.center && "text-accent")} aria-hidden />
              <span className="relative">{t(it.key)}</span>
            </Link>
          );
        })}
      </LayoutGroup>
    </nav>
  );
}

function BottomNav({ items, pathname, unreadMessages }: { items: NavItem[]; pathname: string; unreadMessages: number }) {
  return (
    <nav aria-label="Primary" className="safe-bottom fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="relative mx-3 mb-3 rounded-[28px] sm:mx-auto sm:max-w-xl border border-border bg-surface/90 shadow-pop backdrop-blur-xl">
        <LayoutGroup id="bottomnav">
          <ul className="grid grid-cols-5 items-end px-1.5">
            {items.map((it) => {
              const active = isActive(pathname, it);
              const Icon = it.icon;
              if (it.center) {
                return (
                  <li key={it.href} className="flex justify-center">
                    <Link href={it.href} aria-current={active ? "page" : undefined} aria-label={t(it.key)} className="-mt-6 flex flex-col items-center gap-1">
                      <motion.span whileTap={{ scale: 0.92 }} className={cn("grid size-[3.75rem] place-items-center rounded-full border-4 border-bg bg-accent text-accent-fg shadow-lg", active && "ring-2 ring-accent ring-offset-2 ring-offset-bg")}>
                        <Icon weight="fill" className="size-7" aria-hidden />
                      </motion.span>
                      <span className={cn("pb-1 text-[0.7rem] font-semibold", active ? "text-accent" : "text-muted-fg")}>{t(it.key)}</span>
                    </Link>
                  </li>
                );
              }
              return (
                <li key={it.href}>
                  <Link href={it.href} aria-current={active ? "page" : undefined} className="relative flex h-[3.75rem] flex-col items-center justify-center gap-0.5">
                    {active && <motion.span layoutId="bn-indicator" className="absolute top-1.5 h-[3px] w-6 rounded-full bg-accent" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
                    <span className="relative"><Icon weight={active ? "fill" : "regular"} className={cn("size-6", active ? "text-fg" : "text-muted-fg")} aria-hidden />
                      {it.href === "/admin/messages" && unreadMessages > 0 && <span aria-label={`${unreadMessages} unread`} className="absolute -top-1 -right-2 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.6rem] leading-4 font-bold text-accent-fg">{unreadMessages}</span>}</span>
                    <span className={cn("text-[0.7rem] font-medium", active ? "text-fg" : "text-muted-fg")}>{t(it.key)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </LayoutGroup>
      </div>
    </nav>
  );
}

function AdminSidebar({ pathname, unreadMessages }: { pathname: string; unreadMessages: number }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
      <div className="px-5 pt-5 pb-4"><Logo admin /></div>
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 pb-6">
        <LayoutGroup id="sidebar">
          <ul className="space-y-0.5">
            {ADMIN_NAV.map((it) => <SidebarLink key={it.href} it={it} active={isActive(pathname, it)} badge={it.href === "/admin/messages" ? unreadMessages : 0} />)}
          </ul>
          <p className="mt-6 mb-2 px-3 text-[0.7rem] font-semibold tracking-[0.14em] text-muted-fg uppercase">{t("nav.workspace")}</p>
          <ul className="space-y-0.5">{ADMIN_TOOLS.map((it) => <SidebarLink key={it.href} it={it} active={isActive(pathname, it)} badge={0} />)}</ul>
        </LayoutGroup>
      </nav>
    </aside>
  );
}
function SidebarLink({ it, active, badge }: { it: NavItem; active: boolean; badge: number }) {
  const Icon = it.icon;
  return (
    <li>
      <Link href={it.href} aria-current={active ? "page" : undefined} className={cn("relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors", active ? "text-fg" : "text-muted-fg hover:bg-muted/60 hover:text-fg")}>
        {active && <motion.span layoutId="sidebar-pill" className="absolute inset-0 rounded-xl bg-muted" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
        <Icon weight={active || it.center ? "fill" : "regular"} className={cn("relative size-5", it.center && "text-accent")} aria-hidden />
        <span className="relative flex-1">{t(it.key)}</span>
        {badge > 0 && <span className="relative rounded-full bg-accent px-2 text-xs font-bold text-accent-fg">{badge}</span>}
      </Link>
    </li>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userId, role, hydrated } = useSession();
  const [demoOpen, setDemoOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const isAdminPath = pathname.startsWith("/admin");
  const admin = role !== "fan";
  const publicHelp = pathname.startsWith("/help");

  const msgs = useApiQuery(["unread-msgs"], () => adminApi.unreadMessageCount(userId!), !!userId && admin);
  const scope = useScopeText();

  useEffect(() => {
    if (!hydrated) return;
    if (!userId && !publicHelp) router.replace("/welcome");
    else if (userId && admin && !isAdminPath && !isShared(pathname)) router.replace("/admin");
  }, [hydrated, userId, admin, isAdminPath, pathname, publicHelp, router]);

  if (!hydrated || (!userId && !publicHelp) || (admin && !isAdminPath && !isShared(pathname))) {
    return <div className="grid min-h-dvh place-items-center" role="status" aria-label="Loading PR Show"><Skeleton className="size-14 rounded-full" /></div>;
  }

  if (!userId) {
    return <div className="mx-auto min-h-dvh max-w-3xl px-4 py-6"><div className="mb-6"><Logo /></div>{children}</div>;
  }

  const items = admin ? ADMIN_NAV : FAN_NAV;
  const denied = isAdminPath && !admin;
  const bleed = pathname === "/reels";
  const unreadMessages = msgs.data ?? 0;

  return (
    <div className={cn("min-h-dvh", admin && "lg:pl-64")}>
      {admin && <AdminSidebar pathname={pathname} unreadMessages={unreadMessages} />}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-on-ink">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/85 backdrop-blur-xl">
        <div className={cn("mx-auto flex h-[var(--header-h)] items-center gap-3 px-4 sm:px-6", admin ? "max-w-[88rem]" : "max-w-[var(--content-w)]")}>
          {admin ? <div className="lg:hidden"><Logo admin /></div> : <Logo />}
          {admin && <div className="hidden lg:block"><ScopeBadge>{ROLE_LABEL[role]}{scope ? ` · ${scope}` : ""}</ScopeBadge></div>}
          {!admin && <div className="ml-6 flex-1"><DesktopTopNav items={items} pathname={pathname} /></div>}
          <div className="ml-auto flex items-center gap-1.5">
            {admin && <button onClick={() => setToolsOpen(true)} aria-label="Open workspace tools" className="grid size-10 cursor-pointer place-items-center rounded-full hover:bg-muted lg:hidden"><ListBullets className="size-6" aria-hidden /></button>}
            <DemoButton onClick={() => setDemoOpen(true)} />
            <BellLink />
            <ProfileAvatar />
          </div>
        </div>
      </header>
      <main id="main" className={cn("mx-auto pb-nav lg:pb-16", admin ? "max-w-[88rem]" : "max-w-[var(--content-w)]", bleed ? "px-0 md:max-w-none lg:pb-0" : "px-4 pt-5 sm:px-6 sm:pt-8")}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}>
            {denied ? <AccessDenied /> : children}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav items={items} pathname={pathname} unreadMessages={unreadMessages} />
      <DemoPanel open={demoOpen} onClose={() => setDemoOpen(false)} />
      <Modal open={toolsOpen} onClose={() => setToolsOpen(false)} title="Workspace" description="Admin tools beyond the five primary tabs.">
        <ul className="grid gap-2 sm:grid-cols-2">
          {ADMIN_TOOLS.map((it) => { const Icon = it.icon; return (
            <li key={it.href}><Link href={it.href} onClick={() => setToolsOpen(false)} className="flex items-center gap-3 rounded-2xl border border-border p-3.5 text-sm font-medium hover:bg-muted"><Icon className="size-5 text-accent" aria-hidden />{t(it.key)}</Link></li>
          ); })}
        </ul>
      </Modal>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileImage,
  Inbox,
  Briefcase,
  BarChart3,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { HeliosLogo } from '@/components/shared/helios-logo';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'Accounts', icon: Users },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/posts', label: 'Posts', icon: FileImage },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/clients', label: 'Clients', icon: Briefcase },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/team', label: 'Team', icon: UserCog },
  { href: '/settings', label: 'Settings', icon: Settings },
];

type SidebarProps = {
  /** Renders visible nav in the mobile drawer; default sidebar stays desktop-only below `lg`. */
  variant?: 'default' | 'sheet';
};

export function Sidebar({ variant = 'default' }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, setMobileNavOpen } = useUIStore();
  const isSheet = variant === 'sheet';
  const collapsed = isSheet ? false : sidebarCollapsed;

  return (
    <aside
      className={cn(
        'flex flex-col border-border bg-background transition-all duration-200 ease-in-out',
        isSheet
          ? 'h-full w-full min-h-0 border-r-0'
          : cn(
              'hidden border-r lg:flex',
              collapsed ? 'w-[68px]' : 'w-[240px]'
            )
      )}
    >
      <div className="flex items-center gap-2 px-4 h-16 border-b border-border min-h-16">
        <HeliosLogo size={collapsed ? 'sm' : 'md'} className="max-h-9" />
        {!collapsed && (
          <span className="font-semibold text-lg tracking-tight">HIN</span>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          const link = (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isSheet && setMobileNavOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    />
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return link;
        })}
      </nav>

      {!isSheet && (
        <>
          <Separator />
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="w-full justify-center"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </>
      )}
    </aside>
  );
}

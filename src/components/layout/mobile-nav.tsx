'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Upload,
  Inbox,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Sidebar } from './sidebar';

const bottomTabs = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '#upload', label: 'Upload', icon: Upload, isAction: true },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '#more', label: 'More', icon: MoreHorizontal, isAction: true },
];

export function MobileNav() {
  const pathname = usePathname();
  const { mobileNavOpen, setMobileNavOpen, setUploadModalOpen } = useUIStore();

  return (
    <>
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0 w-[240px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <Sidebar variant="sheet" />
        </SheetContent>
      </Sheet>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.href === '/'
              ? pathname === '/'
              : pathname.startsWith(tab.href);

            if (tab.href === '#upload') {
              return (
                <button
                  key={tab.href}
                  onClick={() => setUploadModalOpen(true)}
                  className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                </button>
              );
            }

            if (tab.href === '#more') {
              return (
                <button
                  key={tab.href}
                  onClick={() => setMobileNavOpen(true)}
                  className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1 text-muted-foreground"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px]">{tab.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px]">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

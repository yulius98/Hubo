import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

export type NavSection = {
    label: string;
    items: NavItem[];
};

type NavMainProps = {
    sections?: NavSection[];
    onItemClick?: (item: NavItem) => void | boolean;
};

export function NavMain({ sections = [], onItemClick }: NavMainProps) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <>
            {sections.map((section) => (
                <SidebarGroup key={section.label} className="px-2 py-0">
                    <SidebarGroupLabel className="px-2 text-[10px] font-semibold tracking-[0.2em] text-sidebar-foreground/45 uppercase">
                        {section.label}
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-1 px-1">
                        {section.items.map((item) => {
                            const active =
                                item.isActive ?? isCurrentUrl(item.href);

                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={active}
                                        tooltip={{ children: item.title }}
                                        className={cn(
                                            'h-9 rounded-lg px-3 text-[13px] font-medium transition-all duration-200',
                                            'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                            active &&
                                                'bg-gradient-to-r from-indigo-500/90 via-blue-500/85 to-cyan-500/80 text-white shadow-lg shadow-indigo-500/25',
                                        )}
                                    >
                                        <Link
                                            href={item.href}
                                            prefetch
                                            onClick={(e) => {
                                                const result =
                                                    onItemClick?.(item);
                                                if (result === false) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            className="relative"
                                        >
                                            {active && (
                                                <span className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-300 to-indigo-400" />
                                            )}
                                            {item.icon && (
                                                <item.icon className="size-4 shrink-0" />
                                            )}
                                            <span>{item.title}</span>
                                            {!!item.badge && item.badge > 0 && (
                                                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white tabular-nums">
                                                    {item.badge > 99
                                                        ? '99+'
                                                        : item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}

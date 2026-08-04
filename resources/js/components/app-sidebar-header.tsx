import { Link, usePage } from '@inertiajs/react';
import { Bell, Moon, Search, Sun } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { useAppearance } from '@/hooks/use-appearance';
import { useInitials } from '@/hooks/use-initials';
import { req_staff } from '@/routes';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: Readonly<{
    breadcrumbs?: BreadcrumbItemType[];
}>) {
    const {
        auth,
        pendingRequestCount = 0,
        pendingRequestList = [],
    } = usePage().props;
    const getInitials = useInitials();
    const { resolvedAppearance, updateAppearance } = useAppearance();

    const userRoles = (auth.user?.role ?? []).map((role) => role.role);
    const isOwner = userRoles.includes('owner outlet');

    const toggleTheme = () =>
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');

    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-5">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />

            <div className="hidden min-w-0 md:block">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="ml-auto flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 text-muted-foreground hover:text-foreground"
                    aria-label="Cari"
                >
                    <Search className="size-4.5" />
                </Button>

                {isOwner && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative size-9 text-muted-foreground hover:text-foreground"
                                aria-label="Notifikasi permintaan menjadi karyawan"
                            >
                                <Bell className="size-4.5" />
                                {pendingRequestCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                                        {pendingRequestCount > 9
                                            ? '9+'
                                            : pendingRequestCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-80 rounded-lg"
                            align="end"
                        >
                            <div className="border-b border-border/60 px-4 py-3">
                                <p className="text-sm font-semibold text-foreground">
                                    Notifikasi
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Permintaan menjadi karyawan
                                </p>
                            </div>

                            {pendingRequestList.length === 0 ? (
                                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                    Tidak ada permintaan baru.
                                </div>
                            ) : (
                                <div className="max-h-72 overflow-y-auto">
                                    {pendingRequestList.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start gap-3 px-4 py-3 hover:bg-accent/50"
                                        >
                                            <Avatar className="size-9 shrink-0 rounded-full">
                                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-500 text-xs text-white">
                                                    {getInitials(
                                                        item.staff_name,
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-foreground">
                                                    {item.staff_name}
                                                </p>
                                                <p className="line-clamp-2 text-xs text-muted-foreground">
                                                    Ingin menjadi karyawan di{' '}
                                                    <span className="font-medium text-foreground/80">
                                                        {item.outlet_name}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <DropdownMenuSeparator />

                            <Link
                                href={req_staff()}
                                className="block px-4 py-2.5 text-center text-sm font-medium text-primary transition-colors hover:bg-accent/50"
                            >
                                Lihat Semua Permintaan
                            </Link>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="size-9 text-muted-foreground hover:text-foreground"
                    aria-label="Ganti tema"
                >
                    {resolvedAppearance === 'dark' ? (
                        <Sun className="size-4.5" />
                    ) : (
                        <Moon className="size-4.5" />
                    )}
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="ml-1 size-9 rounded-full p-0"
                        >
                            <Avatar className="size-8 rounded-full ring-2 ring-primary/25">
                                <AvatarImage
                                    src={auth.user.avatar}
                                    alt={auth.user.name}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-500 text-white">
                                    {getInitials(auth.user.name)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-64 rounded-lg"
                        align="end"
                    >
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

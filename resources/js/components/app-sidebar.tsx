import { router, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Folder,
    LayoutGrid,
    Home,
    Store,
    UserCircle,
    List,
    Briefcase,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    homepage,
    dashboard,
    myoutlet,
    myprofile,
    kelola_produk,
    kategori,
    req_staff,
    cashier,
} from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Home',
        href: homepage(),
        icon: Home,
    },

    {
        title: 'Profile',
        href: myprofile(),
        icon: UserCircle,
    },

    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },

    {
        title: 'Kelola Kategori',
        href: kategori(),
        icon: List,
    },

    {
        title: 'Buka Outlet',
        href: myoutlet(),
        icon: Store,
    },

    {
        title: 'Kelola Produk',
        href: kelola_produk(),
        icon: Store,
    },

    {
        title: 'Request Menjadi Karyawan',
        href: req_staff(),
        icon: Briefcase,
    },

    {
        title: 'Buka Layanan Kasir',
        href: cashier(),
        icon: Briefcase,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar({
    onNavigate,
}: Readonly<{
    onNavigate?: (page: 'dashboard' | 'profile') => void;
}>) {
    const { auth } = usePage().props;

    // Check user roles
    const hasAdminAppRole =
        auth.user?.role?.some((r: any) => r.role === 'admin app') || false;

    const hasKasirRole =
        auth.user?.role?.some((r: any) => r.role === 'kasir') || false;

    const { sidebarOutlets, canSelectAll, selectedOutletId } = usePage().props;
    const hasOutletFilter = sidebarOutlets.length > 0;

    const handleOutletChange = (outletId: number | null) => {
        router.post('/select-outlet', { outlet_id: outletId }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    // Filter nav items based on role
    const filteredNavItems = mainNavItems.filter((item) => {
        if (hasAdminAppRole) {
            // Admin app can see: Profile, Dashboard, Kelola Kategori
            return ['Home', 'Profile', 'Dashboard', 'Kelola Kategori'].includes(
                item.title,
            );
        } else if (hasKasirRole) {
            return [
                'Home',
                'Profile',
                'Dashboard',
                'Buka Outlet',
                'Kelola Produk',
                'Request Menjadi Karyawan',
                'Buka Layanan Kasir',
            ].includes(item.title);
        } else {
            return [
                'Home',
                'Profile',
                'Dashboard',
                'Buka Outlet',
                'Kelola Produk',
                'Request Menjadi Karyawan',
            ].includes(item.title);
        }
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <div>
                                <AppLogo />
                            </div>

                            {/* <Link href='#' prefetch>
                                <AppLogo />
                            </Link> */}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {hasOutletFilter && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Pilih Outlet</SidebarGroupLabel>
                        <div className="px-3 pb-2">
                            <select
                                value={selectedOutletId ?? ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    handleOutletChange(val ? Number(val) : null);
                                }}
                                className="w-full rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2 text-sm text-sidebar-accent-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
                            >
                                {canSelectAll && <option value="">All Outlet</option>}
                                {sidebarOutlets.map((outlet) => (
                                    <option key={outlet.id} value={outlet.id}>
                                        {outlet.nama_outlet}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </SidebarGroup>
                )}
                <NavMain
                    items={filteredNavItems}
                    onItemClick={(item) => {
                        if (item.title === 'Profile') {
                            onNavigate?.('profile');
                        }
                        if (item.title === 'Dashboard') {
                            onNavigate?.('dashboard');
                        }
                    }}
                />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

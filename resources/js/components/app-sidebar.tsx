import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Home, Store } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { homepage, dashboard, myoutlet, myprofile, kelola_produk, kategori, req_staff } from '@/routes';
//import homepage from '@/pages/homepage';

const mainNavItems: NavItem[] = [
    {
        title: 'Home',
        href: homepage(),
        icon: Home,
    },

    {
        title: 'Profile',
        href: myprofile(),
        icon: Home,
    },

    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },

    {
        title: 'Kelola Kategori',
        href: kategori(),
        icon: Home,
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
        icon: Store,
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

export function AppSidebar({ onNavigate }: { onNavigate?: (page: 'dashboard' | 'profile') => void }) {
    const { auth } = usePage().props;

    // Check user roles
    const hasAdminAppRole =
        auth.user?.role?.some((r: any) => r.role === 'admin app') || false;

    // Filter nav items based on role
    const filteredNavItems = mainNavItems.filter(item => {
        if (hasAdminAppRole) {
            // Admin app can see: Profile, Dashboard, Kelola Kategori
            return ['Profile', 'Dashboard', 'Kelola Kategori'].includes(item.title);
        } else {
            return ['Home','Profile', 'Dashboard', 'Buka Outlet', 'Kelola Produk', 'Request Menjadi Karyawan'].includes(item.title);
        }

        // Default: show all for other roles
        return true;
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

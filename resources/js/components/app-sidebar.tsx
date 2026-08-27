import { router, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Boxes,
    Briefcase,
    Building2,
    ChevronDown,
    ClipboardList,
    CreditCard,
    Gem,
    Globe,
    Home,
    LayoutGrid,
    List,
    Package,
    PackagePlus,
    ReceiptText,
    RotateCcw,
    ShieldCheck,
    Store,
    Truck,
    UserCircle,
    UserCog,
} from 'lucide-react';
import { useState } from 'react';
import { NavMain, type NavSection } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import SelectOutletDialog from '@/components/select-outlet-dialog';
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
    useSidebar,
} from '@/components/ui/sidebar';
import {
    cashier,
    dashboard,
    homepage,
    kategori,
    kelola_karyawan,
    kelola_stok,
    myoutlet,
    myprofile,
    orders,
    paket,
    produk,
    req_staff,
} from '@/routes';
import admin from '@/routes/admin';
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
        title: 'Kelola Stok',
        href: kelola_stok(),
        icon: Package,
    },

    {
        title: 'Buka Outlet',
        href: myoutlet(),
        icon: Store,
    },

    {
        title: 'Kelola Karyawan',
        href: kelola_karyawan(),
        icon: UserCog,
    },

    {
        title: 'Request Menjadi Karyawan',
        href: req_staff(),
        icon: Briefcase,
    },

    {
        title: 'Buka Layanan Kasir',
        href: cashier(),
        icon: ReceiptText,
    },

    {
        title: 'Riwayat Pesanan',
        href: orders(),
        icon: ClipboardList,
    },

    {
        title: 'Paket Saya',
        href: paket(),
        icon: Gem,
    },
];

const menuUtamaTitles = ['Home', 'Profile', 'Dashboard', 'Buka Outlet'];

const manajemenTitles = [
    'Kelola Kategori',
    'Kelola Produk',
    'Kelola Stok',
    'Kelola Karyawan',
    'Request Menjadi Karyawan',
    'Buka Layanan Kasir',
    'Riwayat Pesanan',
    'Paket Saya',
];

export function AppSidebar({
    onNavigate,
}: Readonly<{
    onNavigate?: (page: 'dashboard' | 'profile') => void;
}>) {
    const { auth } = usePage().props;
    const { isMobile, setOpenMobile } = useSidebar();

    // Check user roles
    const userRoles = (auth.user?.role ?? []).map(
        (r: { role: string }) => r.role,
    );
    const hasOwnerRole = userRoles.includes('owner outlet');
    const hasAdminRole = userRoles.includes('admin outlet');
    const hasKasirRole = userRoles.includes('kasir');

    const { isSuperAdmin } = usePage().props;
    const { plan, usage } = usePage().props;

    const { sidebarOutlets, canSelectAll, selectedOutletId } = usePage().props;
    const hasOutletFilter = sidebarOutlets.length > 0;
    const [outletDialogOpen, setOutletDialogOpen] = useState(false);
    const [outletRequiredMenu, setOutletRequiredMenu] = useState<{
        menuName: string;
        buildUrl: (outletId: number) => string;
    } | null>(null);

    const handleOutletChange = (outletId: number | null) => {
        const onProductPage = window.location.pathname.startsWith('/produk/');

        router.post(
            '/select-outlet',
            { outlet_id: outletId },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    if (onProductPage) {
                        if (outletId) {
                            router.visit(produk(outletId), {
                                preserveScroll: true,
                            });
                        } else {
                            router.visit(dashboard());
                        }

                        return;
                    }

                    router.reload();
                },
            },
        );
    };

    const outletRequiredUrls: Partial<
        Record<string, (outletId: number) => string>
    > = {
        Dashboard: () => dashboard().url,
        'Kelola Produk': (outletId) => produk(outletId).url,
        'Kelola Kategori': () => kategori().url,
        'Kelola Stok': () => kelola_stok().url,
        'Kelola Karyawan': () => kelola_karyawan().url,
        'Buka Layanan Kasir': () => cashier().url,
    };

    // Filter nav items based on role
    const filteredNavItems = mainNavItems.filter((item) => {
        if (hasOwnerRole) {
            return [
                'Home',
                'Profile',
                'Dashboard',
                'Kelola Kategori',
                'Kelola Stok',
                'Kelola Karyawan',
                'Buka Outlet',
                'Request Menjadi Karyawan',
                'Buka Layanan Kasir',
                'Paket Saya',
            ].includes(item.title);
        } else if (hasAdminRole) {
            return [
                'Home',
                'Profile',
                'Dashboard',
                'Kelola Kategori',
                'Kelola Stok',
            ].includes(item.title);
        } else if (hasKasirRole) {
            return [
                'Home',
                'Profile',
                'Dashboard',
                'Buka Outlet',
                'Request Menjadi Karyawan',
                'Buka Layanan Kasir',
            ].includes(item.title);
        } else if (isSuperAdmin) {
            return ['Home', 'Profile', 'Dashboard', 'Buka Outlet'].includes(
                item.title,
            );
        } else {
            return [
                'Home',
                'Profile',
                'Dashboard',
                'Buka Outlet',
                'Request Menjadi Karyawan',
            ].includes(item.title);
        }
    });

    // Add dynamic kelola produk based on selected outlet
    if (hasOwnerRole || hasAdminRole) {
        filteredNavItems.push({
            title: 'Kelola Produk',
            href: produk(selectedOutletId ?? 0),
            icon: Boxes,
            isActive: window.location.pathname.startsWith('/produk/'),
        });
    }

    const adminNavItems: NavItem[] = [
        {
            title: 'Dashboard Admin',
            href: admin.dashboard(),
            icon: ShieldCheck,
        },
        {
            title: 'Kelola Tenant',
            href: admin.tenants(),
            icon: Building2,
        },
        {
            title: 'Kelola Paket',
            href: admin.paket(),
            icon: CreditCard,
        },
        {
            title: 'Payment Gateway',
            href: admin.paymentGateway(),
            icon: Globe,
        },
        {
            title: 'Shipping API',
            href: admin.shippingSettings(),
            icon: Truck,
        },
        {
            title: 'Supplier',
            href: admin.suppliers(),
            icon: Store,
        },
        {
            title: 'Purchase Order',
            href: admin.purchaseOrders(),
            icon: PackagePlus,
        },
        {
            title: 'Biaya Operasional',
            href: admin.expenses(),
            icon: ReceiptText,
        },
        {
            title: 'Laporan Keuangan',
            href: admin.reports(),
            icon: BarChart3,
        },
        {
            title: 'Retur',
            href: '/admin/returns',
            icon: RotateCcw,
        },
    ];

    const sections: NavSection[] = [
        {
            label: 'Menu Utama',
            items: filteredNavItems.filter((item) =>
                menuUtamaTitles.includes(item.title),
            ),
        },
        {
            label: 'Manajemen',
            items: filteredNavItems.filter((item) =>
                manajemenTitles.includes(item.title),
            ),
        },
        {
            label: 'Admin Pusat',
            items: isSuperAdmin ? adminNavItems : [],
        },
    ].filter((section) => section.items.length > 0);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="relative border-b border-sidebar-border/50">
                <div className="pointer-events-none absolute inset-x-0 -top-16 h-44 bg-[radial-gradient(70%_70%_at_50%_0%,rgba(99,102,241,0.4),transparent)]" />
                <SidebarMenu className="relative">
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <div>
                                <AppLogo subtitleClassName="text-sidebar-foreground/50" />
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {hasOutletFilter && (
                    <SidebarGroup className="px-3 pt-2">
                        <SidebarGroupLabel className="px-1 pb-1.5 text-[10px] font-semibold tracking-[0.2em] text-sidebar-foreground/45 uppercase">
                            Outlet Aktif
                        </SidebarGroupLabel>
                        <div className="relative px-1">
                            <Building2 className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-sidebar-foreground/40" />
                            <select
                                value={selectedOutletId ?? ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    handleOutletChange(
                                        val ? Number(val) : null,
                                    );
                                }}
                                className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-sidebar-border/60 bg-sidebar-accent/40 pr-8 pl-9 text-[13px] font-medium text-sidebar-foreground transition outline-none focus:border-sidebar-ring/70 focus:ring-2 focus:ring-sidebar-ring/20"
                            >
                                {canSelectAll && (
                                    <option value="">All Outlet</option>
                                )}
                                {sidebarOutlets.map((outlet) => (
                                    <option key={outlet.id} value={outlet.id}>
                                        {outlet.nama_outlet}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-sidebar-foreground/40" />
                        </div>
                    </SidebarGroup>
                )}
                <NavMain
                    sections={sections}
                    onItemClick={(item) => {
                        if (isMobile) {
                            setOpenMobile(false);
                        }
                        if (item.title === 'Profile') {
                            onNavigate?.('profile');
                        }
                        if (item.title === 'Dashboard') {
                            onNavigate?.('dashboard');
                        }

                        const buildUrl = outletRequiredUrls[item.title];
                        if (buildUrl && !selectedOutletId) {
                            setOutletRequiredMenu({
                                menuName: item.title,
                                buildUrl,
                            });
                            setOutletDialogOpen(true);
                            return false;
                        }

                        return true;
                    }}
                />
            </SidebarContent>

            <SidebarFooter>
                {plan && usage && (
                    <div className="px-3 pb-1 group-data-[collapsible=icon]:hidden">
                        <div className="flex items-center gap-2.5 rounded-lg border border-sidebar-border/60 bg-sidebar-accent/40 px-3 py-2.5">
                            <CreditCard className="size-4 shrink-0 text-sidebar-foreground/50" />
                            <div className="min-w-0">
                                <p className="truncate text-[13px] font-semibold text-sidebar-foreground">
                                    {plan.name}
                                </p>
                                <p className="truncate text-[11px] text-sidebar-foreground/55">
                                    {plan.max_outlets
                                        ? `${usage.outlets}/${plan.max_outlets} outlet`
                                        : `${usage.outlets} outlet`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                <div className="px-6 pb-1 group-data-[collapsible=icon]:hidden">
                    <span className="text-[10px] font-medium tracking-[0.2em] text-sidebar-foreground/35 uppercase">
                        HUBO v1.0.0
                    </span>
                </div>
                <NavUser />
            </SidebarFooter>

            {outletRequiredMenu && (
                <SelectOutletDialog
                    open={outletDialogOpen}
                    onOpenChange={setOutletDialogOpen}
                    outlets={sidebarOutlets}
                    menuName={outletRequiredMenu.menuName}
                    buildUrl={outletRequiredMenu.buildUrl}
                />
            )}
        </Sidebar>
    );
}

import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import type { Auth } from '@/types/auth'; // pastikan ini ada dan sesuai

// Optional: buat type gabungan shared + page-specific (bisa dipakai di usePage nanti)
export type AppPageProps<T = Record<string, unknown>> = InertiaPageProps & {
    auth: Auth;
    // tambahkan shared props lain jika ada, misal:
    // sidebarOpen: boolean;
    // errors?: Record<string, string>;
    // flash?: { success?: string; error?: string };
} & T;

export type OutletOption = {
    id: number;
    nama_outlet: string;
};

export type PendingRequestListItem = {
    id: number;
    staff_name: string;
    outlet_name: string;
};

export type TenantShared = {
    id: number;
    name: string;
    slug: string;
    status: string;
};

export type PlanShared = {
    id: number;
    name: string;
    slug: string;
    max_outlets: number | null;
    max_products: number | null;
    max_staff: number | null;
    features: string[];
};

export type UsageShared = {
    outlets: number;
    products: number;
    staff: number;
};

declare module '@inertiajs/core' {
    interface PageProps extends InertiaPageProps {
        auth: Auth;
        sidebarOutlets: OutletOption[];
        canSelectAll: boolean;
        selectedOutletId: number | null;
        sidebarOpen?: boolean;
        pendingRequestCount?: number;
        pendingRequestList?: PendingRequestListItem[];
        cartCount?: number;
        isSuperAdmin?: boolean;
        tenant?: TenantShared | null;
        plan?: PlanShared | null;
        usage?: UsageShared | null;
        flash?: { success?: string; error?: string };
    }
}

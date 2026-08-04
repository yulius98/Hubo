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

declare module '@inertiajs/core' {
    interface PageProps extends InertiaPageProps {
        auth: Auth;
        sidebarOutlets: OutletOption[];
        canSelectAll: boolean;
        selectedOutletId: number | null;
        sidebarOpen?: boolean;
        pendingRequestCount?: number;
        pendingRequestList?: PendingRequestListItem[];
    }
}

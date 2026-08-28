import {
    BellIcon,
    CheckIcon,
    CheckBadgeIcon,
    ShoppingBagIcon,
    ExclamationTriangleIcon,
    ArrowPathRoundedSquareIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { notifications } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface NotificationData {
    type?: string;
    message?: string;
    order_number?: string;
    status?: string;
    product?: string;
    outlet_name?: string;
}

interface NotificationItem {
    id: string;
    type: string;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
}

interface NotificationsPageProps extends InertiaPageProps {
    notifications: {
        data: NotificationItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
}

const typeMeta: Record<string, { title: string; icon: (cls: string) => React.ReactNode }> = {
    new_order: {
        title: 'Pesanan Baru',
        icon: (cls) => <ShoppingBagIcon className={cls} />,
    },
    order_status: {
        title: 'Status Pesanan',
        icon: (cls) => <ArrowPathRoundedSquareIcon className={cls} />,
    },
    low_stock: {
        title: 'Stok Menipis',
        icon: (cls) => <ExclamationTriangleIcon className={cls} />,
    },
    staff_request: {
        title: 'Permintaan Karyawan',
        icon: (cls) => <UserPlusIcon className={cls} />,
    },
};

const typeColor: Record<string, string> = {
    new_order: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300',
    order_status: 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
    low_stock: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
    staff_request: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Notifikasi', href: notifications().url },
];

export default function NotificationsPage() {
    const { notifications: paginator } =
        usePage<NotificationsPageProps>().props;

    const markRead = (item: NotificationItem) => {
        if (!item.read_at) {
            router.post(`/notifikasi/${item.id}/read`, {}, { preserveScroll: true });
        }
    };

    const markAllRead = () => {
        router.post('/notifikasi/read-all', {}, { preserveScroll: true });
    };

    const unreadCount = paginator.data.filter((item) => !item.read_at).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifikasi" />
            <main className="mx-auto max-w-4xl p-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-800 md:text-3xl dark:text-gray-100">
                            Notifikasi
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {unreadCount > 0
                                ? `${unreadCount} notifikasi belum dibaca.`
                                : 'Semua notifikasi sudah dibaca.'}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={markAllRead}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                        >
                            <CheckBadgeIcon className="h-5 w-5" />
                            Tandai Semua Dibaca
                        </button>
                    )}
                </div>

                {paginator.data.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <BellIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                            Belum ada notifikasi.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {paginator.data.map((item) => {
                            const meta = typeMeta[item.data.type ?? ''] ?? {
                                title: 'Notifikasi',
                                icon: (cls: string) => <BellIcon className={cls} />,
                            };
                            const color = typeColor[item.data.type ?? ''] ?? typeColor.new_order;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => markRead(item)}
                                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                                        item.read_at
                                            ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                            : 'border-blue-200 bg-blue-50/60 shadow-sm hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                                            {meta.icon('h-5 w-5')}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p
                                                    className={`text-sm font-semibold ${item.read_at ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}
                                                >
                                                    {meta.title}
                                                    {!item.read_at && (
                                                        <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500 align-middle" />
                                                    )}
                                                </p>
                                                <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                                                    {new Date(item.created_at).toLocaleString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                            <p className={`mt-0.5 text-sm ${item.read_at ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                                {item.data.message}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {paginator.last_page > 1 && (
                    <div className="mt-6 flex flex-wrap items-center gap-1">
                        {paginator.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                preserveScroll
                                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                    link.active
                                        ? 'bg-blue-600 font-semibold text-white'
                                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}

                {unreadCount > 0 && (
                    <div className="mt-6 flex items-center justify-center">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                            <CheckIcon className="h-3.5 w-3.5" />
                            Klik notifikasi untuk menandainya sebagai dibaca
                        </span>
                    </div>
                )}
            </main>
        </AppLayout>
    );
}
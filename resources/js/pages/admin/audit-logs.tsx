import { Head, router } from '@inertiajs/react';
import { History, Search } from 'lucide-react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

interface AuditLog {
    id: number;
    event: string;
    description: string | null;
    auditable_type: string;
    auditable_id: number | null;
    user: string;
    ip_address: string | null;
    created_at: string;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
}

interface AuditLogsProps {
    logs: AuditLog[];
    events: Array<{ value: string; label: string }>;
    filters: { event: string; search: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Pusat', href: admin.dashboard().url },
    { title: 'Audit Log', href: admin.auditLogs().url },
];

const eventBadge = (event: string): string => {
    switch (event) {
        case 'created':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
        case 'updated':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
        case 'deleted':
            return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
        case 'login':
        case 'logout':
            return 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300';
        default:
            return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
};

const eventLabel = (event: string): string => {
    switch (event) {
        case 'created':
            return 'Dibuat';
        case 'updated':
            return 'Diperbarui';
        case 'deleted':
            return 'Dihapus';
        case 'restored':
            return 'Dipulihkan';
        case 'login':
            return 'Masuk';
        case 'logout':
            return 'Keluar';
        default:
            return 'Aksi';
    }
};

const formatWaktu = (value: string): string =>
    new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

export default function AuditLogs({
    logs,
    events,
    filters,
}: Readonly<AuditLogsProps>) {
    const applyFilter = (data: { event?: string; search?: string }) => {
        router.get(
            admin.auditLogs().url,
            { ...filters, ...data },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        applyFilter({ search: String(form.get('search') ?? '') });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Log" />

            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-col gap-3 sm:mb-8">
                    <div>
                        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                            <History className="h-8 w-8 text-indigo-500" />
                            Audit Log
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Jejak aktivitas untuk audit dan troubleshooting
                        </p>
                    </div>
                </div>

                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <form
                        onSubmit={handleSearch}
                        className="relative sm:max-w-xs"
                    >
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            name="search"
                            defaultValue={filters.search}
                            placeholder="Cari aktivitas / pengguna..."
                            className="h-10 w-full rounded-xl border border-gray-200 bg-white pr-4 pl-10 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        />
                    </form>

                    <div className="flex flex-wrap items-center gap-2">
                        {[{ value: '', label: 'Semua' }, ...events].map(
                            ({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() =>
                                        applyFilter({ event: value })
                                    }
                                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                                        filters.event === value
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/60'
                                    }`}
                                >
                                    {label}
                                </button>
                            ),
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {logs.length} entri terbaru
                        </span>
                    </div>

                    {logs.length === 0 ? (
                        <div className="px-5 py-16 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700/50">
                                <History className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Tidak ada aktivitas tercatat
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                                        {[
                                            'Waktu',
                                            'Pengguna',
                                            'Aktivitas',
                                            'Objek',
                                            'Event',
                                        ].map((header) => (
                                            <th
                                                key={header}
                                                scope="col"
                                                className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {logs.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                        >
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {formatWaktu(log.created_at)}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {log.user}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                                                {log.description}
                                                {log.new_values && (
                                                    <span className="mt-1 block text-xs text-gray-400 dark:text-gray-500">
                                                        {log.auditable_type}
                                                        {log.auditable_id
                                                            ? ` #${log.auditable_id}`
                                                            : ''}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {log.auditable_type}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${eventBadge(log.event)}`}
                                                >
                                                    {eventLabel(log.event)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}

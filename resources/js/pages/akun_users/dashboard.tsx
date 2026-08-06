import { Head } from '@inertiajs/react';
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    ClipboardList,
    PackageCheck,
    Store,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface DashboardStats {
    totalTransaksi: number;
    totalIn: number;
    totalOut: number;
    jumlahIn: number;
    jumlahOut: number;
}

interface RecentTransaksi {
    id: number;
    tgl_transaksi: string;
    outlet: string;
    produk: string;
    kategori: string;
    jenis_transaksi: 'IN' | 'OUT';
    jumlah_produk: number;
    user: string;
}

interface PerOutletStat {
    outlet_id: number;
    nama_outlet: string;
    total: number;
}

interface DashboardProps {
    stats: DashboardStats;
    recentTransaksis: RecentTransaksi[];
    perOutlet: PerOutletStat[];
    outletLabel: string;
    selectedOutletId: number | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

const getJenisStyles = (jenis: 'IN' | 'OUT') => {
    if (jenis === 'IN') {
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    }

    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
};

export default function Dashboard({
    stats,
    recentTransaksis,
    perOutlet,
    outletLabel,
}: Readonly<DashboardProps>) {
    const statCards = [
        {
            label: 'Total Transaksi',
            value: stats.totalTransaksi,
            icon: ClipboardList,
        },
        {
            label: 'Transaksi IN',
            value: stats.totalIn,
            icon: ArrowDownToLine,
        },
        {
            label: 'Transaksi OUT',
            value: stats.totalOut,
            icon: ArrowUpFromLine,
        },
        {
            label: 'Produk Terjual',
            value: stats.jumlahIn + stats.jumlahOut,
            icon: PackageCheck,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 sm:mb-10">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                        Dashboard
                    </h1>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                        <Store className="h-4 w-4" />
                        Ruang lingkup: {outletLabel}
                    </p>
                </div>

                {stats.totalTransaksi === 0 ? (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                        <div className="px-5 py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                            Belum ada data transaksi untuk ruang lingkup ini.
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid auto-rows-min grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {statCards.map((card) => (
                                <div
                                    key={card.label}
                                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {card.label}
                                        </p>
                                        <card.icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                                        {card.value}
                                    </p>
                                    {card.label === 'Transaksi IN' && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {stats.jumlahIn} unit masuk
                                        </p>
                                    )}
                                    {card.label === 'Transaksi OUT' && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {stats.jumlahOut} unit keluar
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {perOutlet.length > 0 && (
                            <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                                <div className="border-b border-gray-200 bg-gray-50/80 px-5 py-4 sm:px-6 dark:border-gray-700 dark:bg-gray-900/50">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        Transaksi per Outlet
                                    </h2>
                                </div>
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {perOutlet.map((item) => (
                                        <div
                                            key={item.outlet_id}
                                            className="flex items-center justify-between px-5 py-4 sm:px-6"
                                        >
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.nama_outlet}
                                            </span>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {item.total} transaksi
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                            <div className="border-b border-gray-200 bg-gray-50/80 px-5 py-4 sm:px-6 dark:border-gray-700 dark:bg-gray-900/50">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Transaksi Terbaru
                                </h2>
                            </div>

                            <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-700">
                                {recentTransaksis.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white px-5 py-5 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/60"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.produk}
                                            </div>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${getJenisStyles(item.jenis_transaksi)}`}
                                            >
                                                {item.jenis_transaksi}
                                            </span>
                                        </div>
                                        <div className="mt-3 space-y-1 text-sm">
                                            <div className="text-gray-600 dark:text-gray-400">
                                                {item.outlet} · {item.kategori}
                                            </div>
                                            <div className="text-gray-600 dark:text-gray-400">
                                                {item.user} ·{' '}
                                                {item.jumlah_produk} unit ·{' '}
                                                {item.tgl_transaksi}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="hidden md:block">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                                            <tr>
                                                {[
                                                    'Produk',
                                                    'Outlet',
                                                    'Kategori',
                                                    'User',
                                                    'Jenis',
                                                    'Jumlah',
                                                    'Waktu',
                                                ].map((header) => (
                                                    <th
                                                        key={header}
                                                        scope="col"
                                                        className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                                    >
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                            {recentTransaksis.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                                >
                                                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                        {item.produk}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                        {item.outlet}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                        {item.kategori}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                        {item.user}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getJenisStyles(item.jenis_transaksi)}`}
                                                        >
                                                            {
                                                                item.jenis_transaksi
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                        {item.jumlah_produk}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                        {item.tgl_transaksi}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </AppLayout>
    );
}

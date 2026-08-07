import { Head, router } from '@inertiajs/react';
import {
    Banknote,
    ClipboardList,
    PackageCheck,
    Store,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Periode = 'harian' | 'bulanan' | 'tahunan';

interface Outlet {
    id: number;
    nama_outlet: string;
}

interface StatSerie {
    total: number;
    labels: string[];
    data: number[];
}

interface Statistik {
    transaksi: StatSerie;
    produk_terjual: StatSerie;
    omset: StatSerie;
}

interface Karyawan {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    role: string | null;
}

interface ProdukRanking {
    id: number;
    nama_produk: string;
    total_terjual: number;
}

interface RecentTransaksi {
    id: number;
    tgl_transaksi: string;
    produk: string;
    kategori: string;
    jenis_transaksi: 'IN' | 'OUT';
    jumlah_produk: number;
    user: string;
}

interface EmptyState {
    title: string;
    message: string;
}

interface DashboardProps {
    outlet: Outlet | null;
    role: string | null;
    periode: Periode;
    tanggal: string;
    statistik: Statistik | null;
    karyawan: Karyawan[];
    topProduk: ProdukRanking[];
    kurangLaku: ProdukRanking[];
    recentTransaksis: RecentTransaksi[];
    emptyState?: EmptyState | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

const formatNumber = (value: number): string =>
    new Intl.NumberFormat('id-ID').format(value);

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);

const formatWaktu = (value: string): string =>
    new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const toDateInput = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
};

const defaultTanggal = (periode: Periode): string => {
    const now = new Date();

    if (periode === 'bulanan') {
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    if (periode === 'tahunan') {
        return String(now.getFullYear());
    }

    return toDateInput(now);
};

const periodeLabels: Record<Periode, string> = {
    harian: 'Harian',
    bulanan: 'Bulanan',
    tahunan: 'Tahunan',
};

const roleBadgeClass = (role: string | null): string => {
    switch (role) {
        case 'owner outlet':
            return 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white';
        case 'admin outlet':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
        case 'kasir':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
        default:
            return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
};

const roleLabel = (role: string | null): string => {
    switch (role) {
        case 'owner outlet':
            return 'Owner Outlet';
        case 'admin outlet':
            return 'Admin Outlet';
        case 'kasir':
            return 'Kasir';
        default:
            return '—';
    }
};

const getJenisStyles = (jenis: 'IN' | 'OUT'): string => {
    if (jenis === 'IN') {
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    }

    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
};

function StatChart({
    labels,
    data,
    barClass,
    formatValue = formatNumber,
}: Readonly<{
    labels: string[];
    data: number[];
    barClass: string;
    formatValue?: (value: number) => string;
}>) {
    const max = Math.max(...data, 1);
    const step = Math.max(1, Math.ceil(labels.length / 10));

    return (
        <div className="mt-5">
            <div className="flex h-44 items-end gap-[3px]">
                {data.map((value, index) => {
                    const height =
                        max > 0 ? Math.max((value / max) * 100, value > 0 ? 6 : 1.5) : 1.5;

                    return (
                        <div
                            key={index}
                            title={`${labels[index]}: ${formatValue(value)}`}
                            className={`${barClass} w-full rounded-t-md transition-all duration-300`}
                            style={{ height: `${height}%` }}
                        />
                    );
                })}
            </div>
            <div className="mt-2 flex gap-[3px]">
                {labels.map((label, index) => (
                    <div
                        key={index}
                        className={`w-full text-center text-[9px] leading-none text-gray-400 dark:text-gray-500 ${
                            index % step !== 0 && index !== labels.length - 1
                                ? 'invisible'
                                : ''
                        }`}
                    >
                        {label}
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatCard({
    title,
    periode,
    tanggal,
    icon: Icon,
    barClass,
    iconClass,
    serie,
    formatValue,
}: Readonly<{
    title: string;
    periode: Periode;
    tanggal: string;
    icon: typeof ClipboardList;
    barClass: string;
    iconClass: string;
    serie: StatSerie;
    formatValue?: (value: number) => string;
}>) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {title}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatValue ? formatValue(serie.total) : formatNumber(serie.total)}
                    </p>
                </div>
                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <StatChart
                labels={serie.labels}
                data={serie.data}
                barClass={barClass}
                formatValue={formatValue}
            />
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                {periodeLabels[periode]} · {tanggal}
            </p>
        </div>
    );
}

function PeriodSelector({
    periode,
    tanggal,
    onChange,
}: Readonly<{
    periode: Periode;
    tanggal: string;
    onChange: (periode: Periode, tanggal: string) => void;
}>) {
    const currentYear = new Date().getFullYear();
    const years = Array.from(
        { length: currentYear - 1999 },
        (_, index) => currentYear - index,
    );

    const handlePeriodeChange = (next: Periode) => {
        onChange(next, defaultTanggal(next));
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {(Object.keys(periodeLabels) as Periode[]).map((key) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => handlePeriodeChange(key)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            periode === key
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60'
                        }`}
                    >
                        {periodeLabels[key]}
                    </button>
                ))}
            </div>

            {periode === 'harian' && (
                <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => onChange('harian', e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
            )}

            {periode === 'bulanan' && (
                <input
                    type="month"
                    value={tanggal}
                    onChange={(e) => onChange('bulanan', e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
            )}

            {periode === 'tahunan' && (
                <select
                    value={tanggal}
                    onChange={(e) => onChange('tahunan', e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                    {years.map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
}

function KaryawanSection({
    karyawan,
}: Readonly<{ karyawan: Karyawan[] }>) {
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                    Data Karyawan
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {karyawan.length} orang
                </span>
            </div>

            {karyawan.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Belum ada karyawan pada outlet ini.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                                <th className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                    No
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                    Nama
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                    Email
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                    Role
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {karyawan.map((employee, index) => (
                                <tr
                                    key={employee.id}
                                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                >
                                    <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                        {index + 1}
                                    </td>
                                    <td className="px-5 py-3.5 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-gray-100">
                                        {employee.name}
                                    </td>
                                    <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                        {employee.email}
                                    </td>
                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${roleBadgeClass(employee.role)}`}
                                        >
                                            {employee.role ?? '—'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function ProdukRankingSection({
    title,
    items,
    icon: Icon,
    accentClass,
}: Readonly<{
    title: string;
    items: ProdukRanking[];
    icon: typeof TrendingUp;
    accentClass: string;
}>) {
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                <Icon className={`h-4 w-4 ${accentClass}`} />
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                    {title}
                </h2>
            </div>

            {items.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Belum ada data penjualan.
                </div>
            ) : (
                <ol className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map((item, index) => (
                        <li
                            key={item.id}
                            className="flex items-center gap-3 px-5 py-3"
                        >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                {index + 1}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                {item.nama_produk}
                            </span>
                            <span className="text-sm font-semibold whitespace-nowrap text-gray-600 dark:text-gray-400">
                                {formatNumber(item.total_terjual)} unit
                            </span>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}

function RecentTransaksisSection({
    transaksis,
}: Readonly<{ transaksis: RecentTransaksi[] }>) {
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                    10 Transaksi Terbaru
                </h2>
            </div>

            {transaksis.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Belum ada transaksi pada outlet ini.
                </div>
            ) : (
                <>
                    <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-700">
                        {transaksis.map((item) => (
                            <div
                                key={item.id}
                                className="px-5 py-4 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/60"
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
                                <div className="mt-2 space-y-0.5 text-sm">
                                    <div className="text-gray-600 dark:text-gray-400">
                                        {item.kategori} · {item.user}
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400">
                                        {item.jumlah_produk} unit ·{' '}
                                        {formatWaktu(item.tgl_transaksi)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    {[
                                        'Produk',
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
                                {transaksis.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                    >
                                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-gray-100">
                                            {item.produk}
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
                                                {item.jenis_transaksi}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                            {item.jumlah_produk}
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                            {formatWaktu(item.tgl_transaksi)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

export default function Dashboard({
    outlet,
    role,
    periode: initialPeriode,
    tanggal: initialTanggal,
    statistik,
    karyawan = [],
    topProduk = [],
    kurangLaku = [],
    recentTransaksis = [],
    emptyState,
}: Readonly<DashboardProps>) {
    const [periode, setPeriode] = useState<Periode>(initialPeriode);
    const [tanggal, setTanggal] = useState(initialTanggal);

    const handleFilterChange = (nextPeriode: Periode, nextTanggal: string) => {
        setPeriode(nextPeriode);
        setTanggal(nextTanggal);
        router.reload({
            data: { periode: nextPeriode, tanggal: nextTanggal },
        });
    };

    if (!outlet) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />

                <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                    <div className="mb-6 sm:mb-8">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                            Dashboard
                        </h1>
                    </div>

                    <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-6 py-16 text-center dark:border-amber-800/60 dark:bg-amber-900/20">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                            <Store className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                            {emptyState?.title ?? 'Pilih Outlet Terlebih Dahulu'}
                        </h2>
                        <p className="mt-2 max-w-md text-sm text-amber-700 dark:text-amber-300">
                            {emptyState?.message ??
                                'Untuk melihat dashboard, silakan pilih outlet aktif terlebih dahulu pada menu Outlet Aktif di sidebar.'}
                        </p>
                    </div>
                </main>
            </AppLayout>
        );
    }

    const isOwner = role === 'owner outlet';
    const isAdmin = role === 'admin outlet';
    const isKasir = role === 'kasir';
    const canSeeRecent = isOwner || isAdmin;

    const statCards: Array<{
        key: string;
        title: string;
        icon: typeof ClipboardList;
        barClass: string;
        iconClass: string;
        serie?: StatSerie;
        formatValue?: (value: number) => string;
    }> = [];

    if (statistik) {
        statCards.push({
            key: 'transaksi',
            title: isKasir ? 'Transaksi Saya' : 'Transaksi',
            icon: ClipboardList,
            barClass: 'bg-indigo-500',
            iconClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
            serie: statistik.transaksi,
        });

        if (!isKasir) {
            statCards.push({
                key: 'produk',
                title: 'Produk Terjual',
                icon: PackageCheck,
                barClass: 'bg-emerald-500',
                iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
                serie: statistik.produk_terjual,
            });
        }

        if (isOwner) {
            statCards.push({
                key: 'omset',
                title: 'Omset',
                icon: Banknote,
                barClass: 'bg-amber-500',
                iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
                serie: statistik.omset,
                formatValue: formatRupiah,
            });
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                            Dashboard
                            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500/90 via-blue-500/85 to-cyan-500/80 px-3 py-1 text-sm font-medium text-white shadow-sm">
                                <Store className="mr-1.5 h-4 w-4" />
                                {outlet.nama_outlet}
                            </span>
                        </h1>
                        <p className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            Ringkasan performa outlet
                            <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadgeClass(role)}`}
                            >
                                {roleLabel(role)}
                            </span>
                        </p>
                    </div>

                    <PeriodSelector
                        periode={periode}
                        tanggal={tanggal}
                        onChange={handleFilterChange}
                    />
                </div>

                {statCards.length > 0 && (
                    <div
                        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${isOwner ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}
                    >
                        {statCards.map(
                            (card) =>
                                card.serie && (
                                    <StatCard
                                        key={card.key}
                                        title={card.title}
                                        periode={periode}
                                        tanggal={tanggal}
                                        icon={card.icon}
                                        barClass={card.barClass}
                                        iconClass={card.iconClass}
                                        serie={card.serie}
                                        formatValue={card.formatValue}
                                    />
                                ),
                        )}
                    </div>
                )}

                {isOwner && (
                    <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <ProdukRankingSection
                            title="Produk 5 Paling Laku"
                            items={topProduk}
                            icon={TrendingUp}
                            accentClass="text-emerald-600 dark:text-emerald-400"
                        />
                        <ProdukRankingSection
                            title="Produk 5 Kurang Laku"
                            items={kurangLaku}
                            icon={TrendingDown}
                            accentClass="text-red-500 dark:text-red-400"
                        />
                    </div>
                )}

                {isOwner && (
                    <div className="mt-8">
                        <KaryawanSection karyawan={karyawan} />
                    </div>
                )}

                {canSeeRecent && (
                    <div className="mt-8">
                        <RecentTransaksisSection transaksis={recentTransaksis} />
                    </div>
                )}
            </main>
        </AppLayout>
    );
}

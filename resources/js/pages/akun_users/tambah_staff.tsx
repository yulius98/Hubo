import {
    MinusCircleIcon,
    CheckIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { router, Head } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { remove_staff, terima_staff, tolak_staff } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface AddStaff {
    id: number;
    status: string;
    staff?: {
        id: number;
        name: string;
    };
    role?: {
        id: number;
        role: string;
    };
}

interface StaffItem {
    id: number;
    name: string;
    role: string | null;
}

interface TambahStaffProps {
    readonly add_staff: AddStaff[];
    readonly staff: StaffItem[];
    readonly outlet_id: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Penambahan Karyawan/Staff',
        href: '#',
    },
];

export default function Tambah_Staf({
    add_staff = [],
    staff = [],
    outlet_id,
}: TambahStaffProps) {
    const [page] = useState(1);
    const [limit] = useState(10);

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'pending':
                return 'text-yellow-600 dark:text-yellow-400';
            case 'accepted':
                return 'text-green-600 dark:text-green-400';
            case 'rejected':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    // Terima Request
    const handleTerima = async (id: number) => {
        router.post(
            terima_staff.url({ id }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    // Tolak Request
    const handleTolak = async (id: number) => {
        router.put(
            tolak_staff.url({ id }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    // Hapus Staff dari outlet
    const handleRemoveStaff = async (id: number, name: string) => {
        if (!window.confirm(`Yakin ingin menghapus ${name} dari outlet ini?`)) {
            return;
        }

        router.post(
            remove_staff.url({ outlet: outlet_id }),
            { staff_id: id },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penambahan Karyawan/Staff" />

            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                        Penambahan Karyawan/Staff Outlet
                    </h1>
                </div>

                {/* Konten utama: Card di mobile, tabel di md+ */}
                <div className="space-y-4 md:space-y-0 md:rounded-2xl md:border md:border-gray-200 md:bg-white md:shadow-sm md:dark:border-gray-700 md:dark:bg-gray-800">
                    {add_staff.length === 0 ? (
                        <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500 md:border-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                            Belum ada data request role.
                        </div>
                    ) : (
                        add_staff.map((item, nourut) => (
                            <div
                                key={item.id}
                                className={`group relative flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm transition-colors md:table-row md:border-0 md:bg-transparent md:p-0 md:shadow-none md:hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 md:dark:hover:bg-gray-700/50`}
                            >
                                {/* Baris 1: No + Nama (header card di mobile) */}
                                <div className="flex items-center justify-between md:table-cell md:px-6 md:py-4">
                                    <div className="text-sm font-semibold text-gray-700 md:hidden dark:text-gray-300">
                                        #{(page - 1) * limit + nourut + 1}
                                    </div>
                                    <div className="text-base font-medium text-gray-900 dark:text-gray-100">
                                        {item.staff?.name || '—'}
                                    </div>
                                </div>

                                {/* Role */}
                                <div className="text-sm text-gray-600 md:table-cell md:px-6 md:py-4 dark:text-gray-400">
                                    <span className="mr-2 inline-block font-semibold text-gray-700 md:hidden dark:text-gray-300">
                                        Role:
                                    </span>
                                    {item.role?.role || '—'}
                                </div>

                                {/* Status */}
                                <div className="text-sm text-gray-600 md:table-cell md:px-6 md:py-4 dark:text-gray-400">
                                    <span className="mr-2 inline-block font-semibold text-gray-700 md:hidden dark:text-gray-300">
                                        Status:
                                    </span>
                                    <span
                                        className={getStatusClass(item.status)}
                                    >
                                        {item.status}
                                    </span>
                                </div>

                                {/* Aksi */}
                                <div className="text-right md:table-cell md:px-6 md:py-4">
                                    <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleTerima(item.id)
                                            }
                                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 md:flex-none dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50`}
                                        >
                                            <CheckIcon className="h-4 w-4" />
                                            Terima
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleTolak(item.id)}
                                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 md:flex-none dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50`}
                                        >
                                            <MinusCircleIcon className="h-4 w-4" />
                                            Tolak
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Staff saat ini */}
                <div className="mt-8">
                    <h2 className="mb-4 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl dark:text-gray-100">
                        Staff Saat Ini
                    </h2>

                    <div className="space-y-4 md:space-y-0 md:rounded-2xl md:border md:border-gray-200 md:bg-white md:shadow-sm md:dark:border-gray-700 md:dark:bg-gray-800">
                        {staff.length === 0 ? (
                            <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500 md:border-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                                Belum ada staff di outlet ini.
                            </div>
                        ) : (
                            staff.map((item, nourut) => (
                                <div
                                    key={item.id}
                                    className={`group relative flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm transition-colors md:table-row md:border-0 md:bg-transparent md:p-0 md:shadow-none md:hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 md:dark:hover:bg-gray-700/50`}
                                >
                                    <div className="flex items-center justify-between md:table-cell md:px-6 md:py-4">
                                        <div className="text-sm font-semibold text-gray-700 md:hidden dark:text-gray-300">
                                            #{(page - 1) * limit + nourut + 1}
                                        </div>
                                        <div className="text-base font-medium text-gray-900 dark:text-gray-100">
                                            {item.name}
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-600 md:table-cell md:px-6 md:py-4 dark:text-gray-400">
                                        <span className="mr-2 inline-block font-semibold text-gray-700 md:hidden dark:text-gray-300">
                                            Role:
                                        </span>
                                        {item.role || '—'}
                                    </div>

                                    <div className="text-right md:table-cell md:px-6 md:py-4">
                                        <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRemoveStaff(
                                                        item.id,
                                                        item.name,
                                                    )
                                                }
                                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 md:flex-none dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50`}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}

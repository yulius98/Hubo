import AppLayout from '@/layouts/app-layout';
import { router, Head } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';
import { useState } from 'react';
import { MinusCircleIcon, CheckIcon } from '@heroicons/react/24/outline';

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

interface TambahStaffProps {
    readonly add_staff: AddStaff[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Penambahan Karyawan/Staff',
        href: '#',
    },
];

export default function Tambah_Staf({ add_staff = [] }: TambahStaffProps) {
    const [page] = useState(1);
    const [limit] = useState(10);

    // Terima Request
    const handleTerima = async (id: any) => {
        router.put(`/add_staff/${id}/terima`);
    };

    // Tolak Request
    const handleTolak = async (id: any) => {
        console.log('data yang dikirim :', id);
        router.put(`/add_staff/${id}/tolak`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penambahan Karyawan/Staff" />
            <main className="max-w-8xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-800 md:text-3xl dark:text-gray-100">
                        Penambahan Karyawan/Staff Outlet
                    </h1>
                </div>

                <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="overflow-x-auto">
                        <table className="w-full" id="tabel_produk">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700/50">
                                    <th className="w-20 px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        No
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        Nama Staff
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        Role
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {add_staff.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            Belum ada data request role.
                                        </td>
                                    </tr>
                                ) : (
                                    add_staff.map((item, nourut) => (
                                        <tr
                                            key={item.id}
                                            className="bg-white transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/50"
                                        >
                                            <td className="px-6 py-4 text-sm text-gray-600 tabular-nums dark:text-gray-400">
                                                {(page - 1) * limit +
                                                    nourut +
                                                    1}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.staff?.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.role?.role}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.status}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleTerima(
                                                                item.id,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                                        title="Detail"
                                                    >
                                                        <CheckIcon className="h-4 w-4" />
                                                        Terima
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleTolak(item.id)
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                                        title="Detail"
                                                    >
                                                        <MinusCircleIcon className="h-4 w-4" />
                                                        Tolak
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}

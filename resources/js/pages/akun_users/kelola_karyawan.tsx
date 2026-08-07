import {
    CheckIcon,
    MinusCircleIcon,
    TrashIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    kelola_karyawan as kelolaKaryawanRoute,
    remove_staff,
    terima_staff,
    tolak_staff,
} from '@/routes';
import { update_role } from '@/routes/kelola_karyawan';
import type { BreadcrumbItem } from '@/types';

interface Outlet {
    id: number;
    nama_outlet: string;
}

interface Employee {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    role_id: number;
    role: string | null;
}

interface PendingRequest {
    id: number;
    status: string;
    staff?: { id: number; name: string; email: string } | null;
    role?: { id: number; role: string } | null;
}

interface RoleOption {
    id: number;
    role: string;
}

interface KelolaKaryawanProps {
    outlet: Outlet | null;
    employees: Employee[];
    pendingRequests: PendingRequest[];
    roles: RoleOption[];
    selectedOutletId: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelola Karyawan',
        href: kelolaKaryawanRoute().url,
    },
];

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

const getStatusClass = (status: string): string => {
    switch (status) {
        case 'pending':
            return 'text-yellow-600 dark:text-yellow-400';
        case 'done':
            return 'text-green-600 dark:text-green-400';
        case 'reject':
            return 'text-red-600 dark:text-red-400';
        default:
            return 'text-gray-600 dark:text-gray-400';
    }
};

export default function KelolaKaryawan({
    outlet,
    employees = [],
    pendingRequests = [],
    roles = [],
}: KelolaKaryawanProps) {
    const handleTerima = (id: number) => {
        router.post(terima_staff.url({ id }), {}, { preserveScroll: true });
    };

    const handleTolak = (id: number) => {
        router.put(tolak_staff.url({ id }), {}, { preserveScroll: true });
    };

    const handleRoleChange = (employee: Employee, roleId: number) => {
        if (!outlet || roleId === employee.role_id) return;

        router.put(
            update_role.url({ outlet: outlet.id, user: employee.id }),
            { role_id: roleId },
            { preserveScroll: true },
        );
    };

    const handleRemove = (employee: Employee) => {
        if (!outlet) return;

        if (
            !window.confirm(
                `Yakin ingin menghapus ${employee.name} dari outlet ini?`,
            )
        ) {
            return;
        }

        router.post(
            remove_staff.url({ outlet: outlet.id }),
            { staff_id: employee.id },
            { preserveScroll: true },
        );
    };

    if (!outlet) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Kelola Karyawan" />

                <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                    <div className="mb-6 sm:mb-8">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                            Kelola Karyawan
                        </h1>
                    </div>

                    <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-6 py-16 text-center dark:border-amber-800/60 dark:bg-amber-900/20">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                            <UsersIcon className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                            Pilih Outlet Terlebih Dahulu
                        </h2>
                        <p className="mt-2 max-w-md text-sm text-amber-700 dark:text-amber-300">
                            Untuk membuka menu Kelola Karyawan, silakan pilih
                            outlet aktif terlebih dahulu pada menu{' '}
                            <span className="font-semibold">Outlet Aktif</span>{' '}
                            di sidebar. Halaman ini menampilkan karyawan sesuai
                            outlet yang Anda pilih.
                        </p>
                    </div>
                </main>
            </AppLayout>
        );
    }

    const isOwnerRow = (employee: Employee) => employee.role === 'owner outlet';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Karyawan" />

            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                        Kelola Karyawan
                        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500/90 via-blue-500/85 to-cyan-500/80 px-3 py-1 text-sm font-medium text-white shadow-sm">
                            {outlet.nama_outlet}
                        </span>
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Kelola karyawan pada outlet yang sedang aktif. Anda
                        dapat mengubah role dan menghapus karyawan dari outlet.
                    </p>
                </div>

                {/* Statistik */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                            Total Karyawan
                        </p>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {employees.length}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                            Admin Outlet
                        </p>
                        <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {
                                employees.filter(
                                    (e) => e.role === 'admin outlet',
                                ).length
                            }
                        </p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                            Kasir
                        </p>
                        <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {employees.filter((e) => e.role === 'kasir').length}
                        </p>
                    </div>
                </div>

                {/* Permintaan menjadi karyawan */}
                <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                            Permintaan Menjadi Karyawan
                        </h2>
                    </div>

                    {pendingRequests.length === 0 ? (
                        <div className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                            Belum ada permintaan menjadi karyawan untuk outlet
                            ini.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {pendingRequests.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {item.staff?.name ?? '—'}
                                        </p>
                                        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                                            Ingin menjadi{' '}
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                {item.role?.role ?? 'Karyawan'}
                                            </span>{' '}
                                            <span
                                                className={`ml-1 text-xs ${getStatusClass(item.status)}`}
                                            >
                                                ({item.status})
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleTerima(item.id)
                                            }
                                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 sm:flex-none dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                                        >
                                            <CheckIcon className="h-4 w-4" />
                                            Terima
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTolak(item.id)}
                                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 sm:flex-none dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                                        >
                                            <MinusCircleIcon className="h-4 w-4" />
                                            Tolak
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Daftar karyawan */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                            Daftar Karyawan
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {employees.length} orang
                        </span>
                    </div>

                    {employees.length === 0 ? (
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
                                        <th className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Ubah Role
                                        </th>
                                        <th className="w-24 px-5 py-3 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {employees.map((employee, index) => {
                                        const isOwner = isOwnerRow(employee);

                                        return (
                                            <tr
                                                key={employee.id}
                                                className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                            >
                                                <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                    {index + 1}
                                                </td>
                                                <td className="px-5 py-3.5 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                    {employee.name}
                                                    {isOwner && (
                                                        <span className="ml-2 text-xs font-medium text-indigo-500 dark:text-indigo-400">
                                                            (Anda)
                                                        </span>
                                                    )}
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
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    {isOwner ? (
                                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                                            Tidak dapat diubah
                                                        </span>
                                                    ) : (
                                                        <select
                                                            value={
                                                                employee.role_id
                                                            }
                                                            onChange={(e) =>
                                                                handleRoleChange(
                                                                    employee,
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                )
                                                            }
                                                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                                        >
                                                            {roles.map(
                                                                (role) => (
                                                                    <option
                                                                        key={
                                                                            role.id
                                                                        }
                                                                        value={
                                                                            role.id
                                                                        }
                                                                    >
                                                                        {
                                                                            role.role
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    {isOwner ? (
                                                        <span className="text-xs text-gray-300 dark:text-gray-600">
                                                            —
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemove(
                                                                    employee,
                                                                )
                                                            }
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                                            title="Hapus dari outlet"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}

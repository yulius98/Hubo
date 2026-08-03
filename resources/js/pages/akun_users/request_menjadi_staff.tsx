import { Head, useForm } from '@inertiajs/react';
import type { SubmitEvent } from 'react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { req_staff } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface Outlet {
    id: number;
    gambar: string;
    nama_outlet: string;
    kota: string;
    owner?: Array<{
        id: number;
        name: string;
        email: string;
    }>;
}

interface StatusReq {
    id: number;
    status: string;
    owner?: { id: number; name: string };
    outlet?: { id: number; nama_outlet: string };
}

interface RequestUserPageProps {
    outlets: Outlet[];
    jmlOutlet: number;
    user_id: number;
    statusreq: StatusReq[];
    userRoles: string[];
    adminRoleId: number;
    kasirRoleId: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Permintaan Menjadi Karyawan/Staff',
        href: req_staff().url,
    },
];

export default function Request_Menjadi_Staff({
    outlets,
    jmlOutlet,
    user_id,
    statusreq,
    userRoles,
    adminRoleId,
    kasirRoleId,
}: Readonly<RequestUserPageProps>) {
    const [page] = useState(1);
    const [limit] = useState(10);

    const isOwner = userRoles.includes('owner outlet');
    const isKasir = userRoles.includes('kasir');
    const isAdmin = userRoles.includes('admin outlet');

    const canRequestKasir = !isOwner && !isKasir && !isAdmin;
    const canRequestAdmin = !isOwner && !isKasir;
    const noRolesAvailable = !canRequestKasir && !canRequestAdmin;

    const getStatusStyles = (status: string) => {
        const styles = {
            pending:
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
            approved:
                'bg-green-100  text-green-800  dark:bg-green-900/40  dark:text-green-300',
            rejected:
                'bg-red-100    text-red-800    dark:bg-red-900/40    dark:text-red-300', // asumsi 'rejected' atau default
        };

        return styles[status as keyof typeof styles] || styles.rejected; // fallback
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        outlet_id: '',
        role_id: '',
        owner_id: '',
        owner: '',
        user_id: user_id,
        status: 'pending',
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;

        if (name === 'outlet_id' && value) {
            const selectedOutlet = outlets.find(
                (outlet) => outlet.id === Number(value),
            );
            if (selectedOutlet?.owner?.length) {
                const firstOwner = selectedOutlet.owner[0];
                setData((prev) => ({
                    ...prev,
                    outlet_id: value,
                    owner_id: firstOwner.id.toString(),
                    owner: `${firstOwner.name} (${firstOwner.email})`,
                }));
                return;
            }
        }

        setData(name as keyof typeof data, value);
    };

    const handlerequest = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/req_staff', {
            onSuccess: () => reset(),
            onError: (err) => console.log('Validation errors:', err),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permintaan Menjadi Karyawan/Staff" />

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 sm:mb-10">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                        Permintaan Menjadi Karyawan/Staff
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Pilih Outlet dan Role yang diinginkan
                    </p>
                </div>

                {/* ────────────────────────────────────────────────
            FORM REQUEST
        ──────────────────────────────────────────────── */}
                <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 bg-gray-50/80 px-5 py-4 sm:px-6 dark:border-gray-700 dark:bg-gray-900/50">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Form Pengajuan
                        </h2>
                    </div>

                    <div className="px-5 py-6 sm:p-6">
                        {isOwner && (
                            <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-600/40 dark:bg-yellow-900/30 dark:text-yellow-200">
                                Anda adalah <strong>Pemilik Outlet</strong>. Anda tidak dapat mengajukan menjadi karyawan/staff.
                            </div>
                        )}
                        {isKasir && (
                            <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-600/40 dark:bg-yellow-900/30 dark:text-yellow-200">
                                Anda sudah terdaftar sebagai <strong>Kasir</strong> di salah satu outlet. Anda tidak dapat mengajukan menjadi kasir lagi, dan tidak dapat mengajukan menjadi admin.
                            </div>
                        )}
                        {isAdmin && (
                            <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-600/40 dark:bg-yellow-900/30 dark:text-yellow-200">
                                Anda sudah terdaftar sebagai <strong>Admin Outlet</strong>. Anda tidak dapat mengajukan role lain.
                            </div>
                        )}

                        {noRolesAvailable ? (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
                                Tidak ada role yang dapat Anda ajukan.
                            </div>
                        ) : (
                            <form onSubmit={handlerequest} className="space-y-6">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6">
                                {/* Pilih Outlet */}
                                <div>
                                    <label
                                        htmlFor="outlet_id"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Outlet yang dituju
                                    </label>
                                    <select
                                        id="outlet_id"
                                        name="outlet_id"
                                        value={data.outlet_id}
                                        onChange={handleChange}
                                        required
                                        className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="">
                                            — Pilih Outlet —
                                        </option>
                                        {outlets.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.nama_outlet}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.outlet_id && (
                                        <p className="mt-1.5 text-sm text-red-600">
                                            {errors.outlet_id}
                                        </p>
                                    )}
                                </div>

                                {/* Nama Pemilik (readonly) */}
                                <div>
                                    <label
                                        htmlFor="owner"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Pemilik Outlet
                                    </label>
                                    <input
                                        type="text"
                                        id="owner"
                                        name="owner"
                                        value={data.owner}
                                        readOnly
                                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-700 sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                    />
                                </div>

                                {/* Pilih Role */}
                                <div className="sm:col-span-2 lg:col-span-1">
                                    <label
                                        htmlFor="role_id"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Role yang diajukan
                                    </label>
                                    <select
                                        id="role_id"
                                        name="role_id"
                                        value={data.role_id}
                                        onChange={handleChange}
                                        required
                                        className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="">— Pilih Role —</option>
                                        <option value={adminRoleId} disabled={!canRequestAdmin}>
                                            Admin Outlet{!canRequestAdmin ? ' (tidak tersedia)' : ''}
                                        </option>
                                        <option value={kasirRoleId} disabled={!canRequestKasir}>
                                            Kasir Outlet{!canRequestKasir ? ' (tidak tersedia)' : ''}
                                        </option>
                                    </select>
                                    {errors.role_id && (
                                        <p className="mt-1.5 text-sm text-red-600">
                                            {errors.role_id}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing || noRolesAvailable}
                                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 font-medium text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-blue-400 ${processing || noRolesAvailable ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} `}
                                >
                                    {processing ? (
                                        <>
                                            <svg
                                                className="h-5 w-5 animate-spin"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8v8z"
                                                />
                                            </svg>
                                            Memproses...
                                        </>
                                    ) : (
                                        'Kirim Permintaan'
                                    )}
                                </button>
                            </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* ────────────────────────────────────────────────
            STATUS REQUEST - CARD di mobile, Table di desktop
        ──────────────────────────────────────────────── */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 bg-gray-50/80 px-5 py-4 sm:px-6 dark:border-gray-700 dark:bg-gray-900/50">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Status Pengajuan Saya
                        </h2>
                    </div>

                    {/* Mobile: Card view */}
                    <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-700">
                        {statusreq.length === 0 ? (
                            <div className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                Belum ada pengajuan role.
                            </div>
                        ) : (
                            statusreq.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="bg-white px-5 py-5 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/60"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            #{(page - 1) * limit + index + 1}
                                        </div>
                                        <div
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyles(item.status)}`}
                                        >
                                            {item.status}
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-1 text-sm">
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {item.outlet?.nama_outlet || '—'}
                                        </div>
                                        <div className="text-gray-600 dark:text-gray-400">
                                            {item.owner?.name || '—'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop: Table view */}
                    <div className="hidden md:block">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800/50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="w-16 px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                        >
                                            No
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                        >
                                            Outlet
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                        >
                                            Pemilik
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                        >
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                    {statusreq.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                                            >
                                                Belum ada data pengajuan.
                                            </td>
                                        </tr>
                                    ) : (
                                        statusreq.map((item, index) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                            >
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                    {(page - 1) * limit +
                                                        index +
                                                        1}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                    {item.outlet?.nama_outlet ||
                                                        '—'}
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                    {item.owner?.name || '—'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusStyles(item.status)}`}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}

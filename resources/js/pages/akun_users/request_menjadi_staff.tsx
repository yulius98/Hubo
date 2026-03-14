import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';
import { req_staff } from '@/routes';
import React, { useState } from 'react';

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
    owner?: {
        id: number;
        name: string;
    };
    outlet?: {
        id: number;
        nama_outlet: string;
    };
}

interface RequestUserPageProps {
    outlets: Outlet[];
    jmlOutlet: number;
    user_id: number;
    statusreq: StatusReq[];
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
}: Readonly<RequestUserPageProps>) {
    const [page] = useState(1);
    const [limit] = useState(10);

    // ================== USEFORM (REKOMENDASI INERTIA) ==================
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

        // Khusus outlet_id → otomatis isi owner + owner_id
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

        // Semua field lain (termasuk role_id, owner, dll) → update biasa
        setData(name as keyof typeof data, value);
    };;

    const handlerequest = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/req_staff', {
            onSuccess: () => {
                reset(); // bersihkan form otomatis
            },
            onError: (err) => {
                console.log('Validation errors:', err);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permintaan Menjadi Karyawan/Staff" />
            <main className="max-w-8xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-800 md:text-3xl dark:text-gray-100">
                        Permintaan Menjadi Karyawan/Staff
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Pilih Outlet dan Role.
                    </p>
                </div>

                {/* Card: Form Request */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            Form Request
                        </h2>
                    </div>

                    <div className="p-6 pt-4">
                        <form onSubmit={handlerequest}>
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="min-w-[200px] flex-1">
                                    <div className="mt-4">
                                        <label
                                            htmlFor="outlet_id"
                                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Pilih Outlet
                                        </label>
                                        <select
                                            id="outlet_id"
                                            name="outlet_id"
                                            value={data.outlet_id}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                        >
                                            <option value="">
                                                Pilih Outlet
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
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.outlet_id}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-4">
                                        <label
                                            htmlFor="owner"
                                            className="mt-4 mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Nama Pemilik Outlet
                                        </label>
                                        <input
                                            type="text"
                                            id="owner"
                                            name="owner"
                                            value={data.owner}
                                            readOnly
                                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                        />
                                    </div>

                                    <div className="mt-4">
                                        <label
                                            htmlFor="role_id"
                                            className="mt-4 mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Pilih Role
                                        </label>
                                        <select
                                            id="role_id"
                                            name="role_id"
                                            value={data.role_id}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                        >
                                            <option value="">Pilih Role</option>
                                            <option value="3">
                                                Admin Outlet
                                            </option>
                                            <option value="5">
                                                Kasir Outlet
                                            </option>
                                        </select>
                                        {errors.role_id && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.role_id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ================== TOMBOL SUBMIT DENGAN LOADING ================== */}
                            <button
                                type="submit"
                                disabled={processing}
                                className={`mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 font-medium text-white transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                                    processing
                                        ? 'cursor-not-allowed bg-blue-400'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                }`}
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
                                    'Submit Permintaan'
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Status Request (tetap sama) */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            Status Request
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full" id="tabel_produk">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700/50">
                                    <th className="w-20 px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        No
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        Nama Outlet
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        Nama Pemilik Outlet
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {statusreq.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            Belum ada data request role.
                                        </td>
                                    </tr>
                                ) : (
                                    statusreq.map((item, nourut) => (
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
                                                {item.outlet?.nama_outlet}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.owner?.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.status}
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

import AppLayout from '@/layouts/app-layout'
import { Head, usePage } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types'
import { req_staff } from '@/routes';
import React, { useState, useEffect, useRef } from 'react'
import { router, type PageProps as InertiaPageProps } from '@inertiajs/core'
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    XMarkIcon,
    UserPlusIcon,
    EyeIcon,
} from '@heroicons/react/24/outline'

interface Outlet {
    id: number,
    gambar: string,
    nama_outlet: string,
    kota: string,
    owner?: Array<{
        id: number,
        name: string,
        email: string
    }>
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

export default function request_menjadi_staff({
    outlets,
    jmlOutlet,
    user_id,
    statusreq,
}: RequestUserPageProps) {
    const [error, setError] = useState('');
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const fetchOutletRef = useRef<(() => void) | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [selectedRoles, setSelectedRoles] = useState<Record<number, number>>(
        {},
    );
    const totalPages = Math.max(1, Math.ceil(jmlOutlet / limit));
    const [preview, setPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        outlet_id: '',
        role_id: '',
        owner_id: '',
        owner: '',
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;

        // Jika yang diubah adalah outlet_id
        if (name === 'outlet_id' && value) {
            // Cari outlet yang dipilih
            const selectedOutlet = outlets.find(
                (outlet) => outlet.id === Number(value),
            );

            if (
                selectedOutlet &&
                selectedOutlet.owner &&
                selectedOutlet.owner.length > 0
            ) {
                // Set owner_id dan owner name
                setFormData((prev) => ({
                    ...prev,
                    [name]: value,
                    owner_id: selectedOutlet.owner![0].id.toString(),
                    owner: `${selectedOutlet.owner![0].name} (${selectedOutlet.owner![0].email})`,
                }));
                return;
            }
        }

        // Untuk field lainnya
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlerequest = async (e: any) => {
        e.preventDefault();
        try {
            const datatoSend = {
                id_staff: user_id,
                id_owner: Number(formData.owner_id),
                id_role: Number(formData.role_id),
                id_outlet: Number(formData.outlet_id),
                status: 'pending',
            };

            
            router.post('/req_staff', datatoSend, {
                onSuccess: () => {
                    setFormData({
                        outlet_id: '',
                        role_id: '',
                        owner_id: '',
                        owner: '',
                    });
                },
                onError: (errors) => {
                    console.log(errors);
                },
            });
        } catch (err) {
            setError('Gagal request');
            // Tampilkan error detail dari backend jika ada
            console.log('Error response:', err);
        }
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
                                    <label
                                        htmlFor="nama_outlet"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Pilih Outlet
                                    </label>
                                    <select
                                        id="outlet_id"
                                        name="outlet_id"
                                        value={formData.outlet_id ?? ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="">Pilih Outlet</option>
                                        {outlets.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.nama_outlet}
                                            </option>
                                        ))}
                                    </select>
                                    <label
                                        htmlFor="nama_outlet"
                                        className="mt-4 mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Nama Pemilik Outlet
                                    </label>
                                    <input
                                        type="text"
                                        id="owner"
                                        name="owner"
                                        value={formData.owner}
                                        onChange={handleChange}
                                        readOnly
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                    />
                                    <label
                                        htmlFor="role"
                                        className="mt-4 mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Pilih Role
                                    </label>
                                    <select
                                        id="role_id"
                                        name="role_id"
                                        value={formData.role_id}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="">Pilih Role</option>
                                        <option value="3">Admin Outlet</option>
                                        <option value="5">Kasir Outlet</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                            >
                                Submit
                            </button>
                        </form>
                    </div>
                </div>

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
                                            colSpan={3}
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

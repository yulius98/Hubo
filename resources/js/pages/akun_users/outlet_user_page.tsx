import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    XMarkIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, Head, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { myoutlet } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface Outlet {
    id: number;
    gambar: string;
    nama_outlet: string;
    alamat_outlet: string;
    kota: string;
    telp: string;
}

interface OutletPageProps extends InertiaPageProps {
    outlets: Outlet[];
    jmlOutlet: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Outlet Saya',
        href: myoutlet().url,
    },
];

export default function Outlet_User_Page() {
    const [error, setError] = useState('');
    const [editId, setEditId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        id: null as number | null,
        gambar: null as File | null,
        nama_outlet: '',
        alamat_outlet: '',
        kota: '',
        telp: '',
    });

    const { outlets: rawOutlets, jmlOutlet } = usePage<OutletPageProps>().props;
    const outlets = rawOutlets ?? [];

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData((prev) => ({ ...prev, gambar: file }));
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            id: null,
            gambar: null,
            nama_outlet: '',
            alamat_outlet: '',
            kota: '',
            telp: '',
        });
        setPreview(null);
        setEditId(null);
        setError('');
    };

    const handleCreate = (e: React.SubmitEvent) => {
        e.preventDefault();
        const data = new FormData();
        if (formData.gambar) data.append('gambar', formData.gambar);
        data.append('nama_outlet', formData.nama_outlet);
        data.append('alamat_outlet', formData.alamat_outlet);
        data.append('kota', formData.kota);
        data.append('telp', formData.telp);

        router.post('myoutlet', data, {
            onSuccess: () => {
                setShowForm(false);
                resetForm();
            },
            onError: (errors) => console.log(errors),
        });
    };

    const handleUpdate = (e: React.SubmitEvent) => {
        e.preventDefault();
        const data = new FormData();
        data.append('_method', 'PUT');
        if (formData.gambar) data.append('gambar', formData.gambar);
        data.append('nama_outlet', formData.nama_outlet);
        data.append('alamat_outlet', formData.alamat_outlet);
        data.append('kota', formData.kota);
        data.append('telp', formData.telp);

        router.post(`/myoutlet/${formData.id}`, data, {
            onSuccess: () => {
                setShowForm(false);
                resetForm();
            },
        });
    };

    const handleDelete = (id: number) => {
        if (!confirm('Yakin hapus outlet ini?')) return;
        router.delete(`/myoutlet/${id}`);
    };

    const handleTambahProduk = (id: number) => router.get(`/produk/${id}`);
    const handleTambahStaff = (id: number) => router.get(`/add_staff/${id}`);

    const handleEdit = (item: Outlet) => {
        setEditId(item.id);
        setFormData({
            id: item.id,
            gambar: null, // file baru opsional
            nama_outlet: item.nama_outlet,
            alamat_outlet: item.alamat_outlet,
            kota: item.kota,
            telp: item.telp,
        });
        setPreview(item.gambar ? `/${item.gambar}` : null);
        setShowForm(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Outlet saya" />

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
                        Kelola Outlet
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Tambah, edit, atau hapus outlet Anda
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-400 bg-red-50 p-4 text-sm text-red-700 dark:border-red-600 dark:bg-red-900/30 dark:text-red-300">
                        {error}
                    </div>
                )}

                {/* ── FORM ──────────────────────────────────────────────── */}
                <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            {editId ? 'Edit Outlet' : 'Tambah Outlet Baru'}
                        </h2>
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(!showForm);
                                if (showForm) resetForm();
                            }}
                            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none sm:text-base dark:focus:ring-offset-gray-900"
                        >
                            {showForm ? (
                                <>
                                    <XMarkIcon className="h-5 w-5" />
                                    Tutup
                                </>
                            ) : (
                                <>
                                    <PlusIcon className="h-5 w-5" />
                                    Tambah Outlet
                                </>
                            )}
                        </button>
                    </div>

                    {showForm && (
                        <form
                            onSubmit={editId ? handleUpdate : handleCreate}
                            className="divide-y divide-gray-200 dark:divide-gray-700"
                        >
                            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:gap-6 sm:p-6">
                                {/* Kolom kiri - inputs */}
                                <div className="space-y-5">
                                    <div>
                                        <label
                                            htmlFor="gambar-upload"
                                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Foto/Logo Outlet
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:file:bg-blue-900/40 dark:file:text-blue-300"
                                        />
                                        {preview && (
                                            <div className="mt-3">
                                                <img
                                                    src={preview}
                                                    alt="Preview"
                                                    className="h-28 w-28 rounded-lg object-cover shadow-sm sm:h-32 sm:w-32"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="outlet"
                                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Nama Outlet
                                        </label>
                                        <input
                                            type="text"
                                            name="nama_outlet"
                                            value={formData.nama_outlet}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="alamat"
                                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Alamat Lengkap
                                        </label>
                                        <input
                                            type="text"
                                            name="alamat_outlet"
                                            value={formData.alamat_outlet}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                        />
                                    </div>
                                </div>

                                {/* Kolom kanan */}
                                <div className="space-y-5">
                                    <div>
                                        <label
                                            htmlFor="kota"
                                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Kota / Kabupaten
                                        </label>
                                        <input
                                            type="text"
                                            name="kota"
                                            value={formData.kota}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="telp"
                                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Nomor Telepon / WA
                                        </label>
                                        <input
                                            type="tel"
                                            name="telp"
                                            value={formData.telp}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                        />
                                    </div>

                                    <div className="flex items-end pt-2 sm:pt-8">
                                        <button
                                            type="submit"
                                            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none sm:w-auto sm:px-8 sm:py-2.5"
                                        >
                                            {editId
                                                ? 'Simpan Perubahan'
                                                : 'Tambah Outlet'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* ── DAFTAR OUTLET ─────────────────────────────────────── */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            Daftar Outlet Saya
                        </h2>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Total:{' '}
                            <span className="font-medium">{jmlOutlet}</span>{' '}
                            outlet
                        </div>
                    </div>

                    {/* Mobile: Card view */}
                    <div className="md:hidden">
                        {outlets.length === 0 ? (
                            <div className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                Belum ada data outlet.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {outlets.map((item) => (
                                    <div
                                        key={item.id}
                                        className="space-y-4 px-5 py-6 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                    >
                                        <div className="flex items-start gap-4">
                                            {item.gambar ? (
                                                <img
                                                    src={`/${item.gambar}`}
                                                    alt={item.nama_outlet}
                                                    className="h-16 w-16 rounded-lg object-cover sm:h-20 sm:w-20"
                                                />
                                            ) : (
                                                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-200 text-xs text-gray-500 sm:h-20 sm:w-20 dark:bg-gray-700 dark:text-gray-400">
                                                    No Image
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                                    {item.nama_outlet}
                                                </h3>
                                                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                                                    {item.alamat_outlet}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Kota
                                                </span>
                                                <p className="font-medium">
                                                    {item.kota}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Telp
                                                </span>
                                                <p className="font-medium">
                                                    {item.telp}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() =>
                                                    handleTambahProduk(item.id)
                                                }
                                                className="flex-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 sm:text-sm dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                            >
                                                <PlusIcon className="inline h-4 w-4" />{' '}
                                                Produk
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleTambahStaff(item.id)
                                                }
                                                className="flex-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 sm:text-sm dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                            >
                                                <UserPlusIcon className="inline h-4 w-4" />{' '}
                                                Staff
                                            </button>
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="flex-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 sm:text-sm dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                            >
                                                <PencilSquareIcon className="inline h-4 w-4" />{' '}
                                                Edit
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(item.id)
                                                }
                                                className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 sm:text-sm dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                                            >
                                                <TrashIcon className="inline h-4 w-4" />{' '}
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desktop & Tablet: Table view */}
                    <div className="hidden md:block">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="w-16 px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                            No
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                            Avatar
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                            Nama Outlet
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                            Alamat
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                            Kota
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                            Telp
                                        </th>
                                        <th className="w-64 px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {outlets.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                                            >
                                                Belum ada data outlet.
                                            </td>
                                        </tr>
                                    ) : (
                                        outlets.map((item, index) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                                            >
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {item.gambar ? (
                                                        <img
                                                            src={`/${item.gambar}`}
                                                            alt={
                                                                item.nama_outlet
                                                            }
                                                            className="h-16 w-16 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-200 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                                            No Image
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                    {item.nama_outlet}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                                    {item.alamat_outlet}
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                    {item.kota}
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                    {item.telp}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-wrap justify-center gap-2">
                                                        <button
                                                            onClick={() =>
                                                                handleTambahProduk(
                                                                    item.id,
                                                                )
                                                            }
                                                            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                                        >
                                                            <PlusIcon className="inline h-4 w-4" />{' '}
                                                            Produk
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleTambahStaff(
                                                                    item.id,
                                                                )
                                                            }
                                                            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                                        >
                                                            <UserPlusIcon className="inline h-4 w-4" />{' '}
                                                            Staff
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleEdit(item)
                                                            }
                                                            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                                        >
                                                            <PencilSquareIcon className="inline h-4 w-4" />{' '}
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    item.id,
                                                                )
                                                            }
                                                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                                                        >
                                                            <TrashIcon className="inline h-4 w-4" />{' '}
                                                            Hapus
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
                </div>
            </main>
        </AppLayout>
    );
}

import React, { useState, useRef } from 'react';
import { router, Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { myoutlet } from '@/routes';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    XMarkIcon,
    UserPlusIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';

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
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [page] = useState(1);
    const [limit] = useState(10);
    const [preview, setPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        id: null,
        gambar: null,
        nama_outlet: '',
        alamat_outlet: '',
        kota: '',
        telp: '',
    });

    const handleImageChange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({ ...prev, gambar: file }));
            setPreview(URL.createObjectURL(file)); // preview sebelum upload
        }
    };

    const { outlets: rawOutlets, jmlOutlet } = usePage<OutletPageProps>().props;
    const outlets = rawOutlets ?? [];
    const fetchOutletRef = useRef<(() => void) | null>(null);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        if (name == 'kategori') {
            setFormData((prev) => ({
                ...prev,
                kategori: value,
                id_kategori: value,
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    // CREATE
    const handleCreate = async (e: any) => {
        e.preventDefault();
        try {
            // Tampilkan data yang akan dikirim ke backend
            const dataToSend = {
                gambar: formData.gambar,
                nama_outlet: formData.nama_outlet,
                alamat_outlet: formData.alamat_outlet,
                kota: formData.kota,
                telp: formData.telp,
            };

            router.post('myoutlet', dataToSend, {
                onSuccess: () => {
                    setShowForm(false);
                    setFormData({
                        id: null,
                        gambar: null,
                        nama_outlet: '',
                        alamat_outlet: '',
                        kota: '',
                        telp: '',
                    });
                    setPreview(null);
                },
                onError: (errors) => {
                    console.log(errors);
                },
            });

            // Refresh produk table after create
            if (fetchOutletRef.current) fetchOutletRef.current();
        } catch (err) {
            setError('Gagal menambah outlet');
            // Tampilkan error detail dari backend jika ada
            console.log('Error response:', err);
        }
    };

    // Edit button
    const handleEdit = (item: any) => {
        setEditId(item.id);
        setFormData({
            id: item.id,
            gambar: item.gambar,
            nama_outlet: item.nama_outlet,
            alamat_outlet: item.alamat_outlet,
            kota: item.kota,
            telp: item.telp,
        });
        // Set preview for existing image
        if (item.gambar) {
            setPreview(`/${item.gambar}`);
        }
        setShowForm(true);
    };

    // UPDATE
    const handleUpdate = async (e: any) => {
        e.preventDefault();
        try {
            const dataToSend = {
                id: formData.id,
                gambar: formData.gambar,
                nama_outlet: formData.nama_outlet,
                alamat_outlet: formData.alamat_outlet,
                kota: formData.kota,
                telp: formData.telp,
            };

            router.put(`/myoutlet/${formData.id}`, dataToSend);

            setShowForm(false);
            setEditId(null);
            setFormData({
                id: null,
                gambar: null,
                nama_outlet: '',
                alamat_outlet: '',
                kota: '',
                telp: '',
            });
            setPreview(null);

            if (fetchOutletRef.current) fetchOutletRef.current();
        } catch {
            setError('Gagal mengedit outlet');
        }
    };

    // DELETE
    const handleDelete = async (id: any) => {
        if (!confirm('Yakin hapus data ini?')) return;
        try {
            router.delete(`/myoutlet/${id}`);

            setShowForm(false);
            setEditId(null);
            setFormData({
                id: null,
                gambar: null,
                nama_outlet: '',
                alamat_outlet: '',
                kota: '',
                telp: '',
            });
            setPreview(null);

            if (fetchOutletRef.current) fetchOutletRef.current();
        } catch {
            setError('Gagal menghapus outlet');
        }
    };

    // TAMBAH PRODUK
    const handleTambahProduk = async (id: any) => {
        router.get(`/produk/${id}`);
    };

    // TAMBAH STAFF
    const handleTambahStaff = async (id: any) => {
        router.get(`/add_staff/${id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Outlet saya" />
            <main className="max-w-8xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-800 md:text-3xl dark:text-gray-100">
                        Kelola Outlet
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Tambah, edit, atau hapus outlet.
                    </p>
                </div>

                {/* Error alert */}
                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                {/* Card: Form Tambah/Edit */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            {editId ? 'Edit Outlet' : 'Form Outlet'}
                        </h2>
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(!showForm);
                                setEditId(null);
                                setFormData({
                                    id: null,
                                    gambar: null,
                                    nama_outlet: '',
                                    alamat_outlet: '',
                                    kota: '',
                                    telp: '',
                                });
                                setPreview(null);
                                setError('');
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                        >
                            {showForm ? (
                                <>
                                    <XMarkIcon className="h-5 w-5" />
                                    Tutup Form
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
                            className="p-6 pt-4"
                        >
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="min-w-[200px] flex-1">
                                    <label
                                        htmlFor="nama_outlet"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Avatar Outlet
                                    </label>
                                    <input
                                        type="file"
                                        id="gambar"
                                        name="gambar"
                                        onChange={handleImageChange}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                    />

                                    {preview && (
                                        <div className="mt-2">
                                            <img
                                                src={preview}
                                                alt="Preview"
                                                className="h-48 w-48 object-cover"
                                            />
                                        </div>
                                    )}
                                    <label
                                        htmlFor="nama_outlet"
                                        className="mt-4 mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Nama Outlet
                                    </label>
                                    <input
                                        type="text"
                                        id="nama_outlet"
                                        name="nama_outlet"
                                        value={formData.nama_outlet}
                                        onChange={handleChange}
                                        placeholder="Contoh: Viva Store"
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                    />
                                    <label
                                        htmlFor="alamat"
                                        className="mt-4 mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Alamat
                                    </label>
                                    <input
                                        type="text"
                                        id="alamat_outlet"
                                        name="alamat_outlet"
                                        value={formData.alamat_outlet}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                    />
                                    <label
                                        htmlFor="kota"
                                        className="mt-4 mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Kota
                                    </label>
                                    <input
                                        type="text"
                                        id="kota"
                                        name="kota"
                                        value={formData.kota}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                    />
                                    <label
                                        htmlFor="no_telp"
                                        className="mt-4 mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        No Telp
                                    </label>
                                    <input
                                        type="text"
                                        id="telp"
                                        name="telp"
                                        value={formData.telp}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                                >
                                    {editId ? 'Simpan Perubahan' : 'Tambah'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Card: Tabel Kategori */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            Daftar Outlet Saya
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Total:{' '}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {jmlOutlet}
                            </span>{' '}
                            Outlet
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full" id="tabel_produk">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700/50">
                                    <th className="w-20 px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        No
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        Avatar Outlet
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        Nama Outlet
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        Alamat Outlet
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        Kota
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        No Telp
                                    </th>
                                    <th className="w-40 px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {outlets.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            Belum ada data outlet. Klik
                                            &quot;Tambah Kategori&quot; untuk
                                            menambah.
                                        </td>
                                    </tr>
                                ) : (
                                    outlets.map((item, nourut) => (
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
                                                {item.gambar ? (
                                                    <img
                                                        src={`/${item.gambar}`}
                                                        alt={item.nama_outlet}
                                                        className="h-20 w-20 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
                                                        <span className="text-xs text-gray-400">
                                                            No Image
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.nama_outlet}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.alamat_outlet}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.kota}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.telp}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleTambahProduk(
                                                                item.id,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                                        title="Detail"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                        Tambah Produk
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleTambahStaff(
                                                                item.id,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                                        title="Detail"
                                                    >
                                                        <UserPlusIcon className="h-4 w-4" />
                                                        Tambah Staff
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(item)
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                                        title="Edit"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                        Edit Outlet
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                item.id,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                                                        title="Hapus"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                        Hapus Outlet
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                            Tampil per halaman:
                            </span>
                            <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                            {[5, 10, 20, 50].map((size) => (
                                <option key={size} value={size}>
                                {size}
                                </option>
                            ))}
                            </select>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                            Total: {totalkategori} kategori
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                            Sebelumnya
                            </button>
                            <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                            Halaman {page} dari {totalPages}
                            </span>
                            <button
                            type="button"
                            onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                            disabled={page >= totalPages}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                            Selanjutnya
                            </button>
                        </div>
                    </div> */}
                </div>
            </main>
        </AppLayout>
    );
}

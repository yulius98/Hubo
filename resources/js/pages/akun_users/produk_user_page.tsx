import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Head, router } from '@inertiajs/react';
import React, { useState, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { produk } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface Kategori {
    id: number;
    gambar: string;
    kategori: string;
}
interface Produk {
    id: number | null;
    nama_produk: string;
    harga: number;
    gambar: string;
    kategori?: { id: number; kategori: string };
}

interface PaginatedProduk {
    data: Produk[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Produk',
        href: '/produk',
    },
];

interface Outlet {
    id: number;
    nama_outlet: string;
    alamat_outlet: string;
    kota: string;
    telp: string;
}

interface ProdukUserPageProps {
    outlet: Outlet;
    produk: PaginatedProduk;
    kategori: Kategori[];
    jmlProduk: number;
}

const formatRupiah = (value: any) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
    }).format(value);

export default function Produk_User_Page({
    outlet,
    produk: produkPaginated,
    kategori,
    jmlProduk,
}: Readonly<ProdukUserPageProps>) {
    const [error, setError] = useState('');
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [preview, setPreview] = useState<string | null>(null);
    const kategoris = kategori ?? [];
    const fetchProdukRef = useRef<(() => void) | null>(null);
    const totalPages = Math.max(1, Math.ceil(jmlProduk / limit));

    // Extract data array from paginator object
    const produk = Array.isArray(produkPaginated)
        ? produkPaginated
        : produkPaginated?.data || [];

    const [formData, setFormData] = useState<{
        id: number | null;
        id_outlet: number | null;
        id_kategori: number | null;
        kategori: string;
        gambar: File | null;
        nama_produk: string;
        keterangan: string;
        harga: string;
        diskon: string;
        harga_diskon: string;
    }>({
        id: null,
        id_outlet: null,
        id_kategori: null,
        kategori: '',
        gambar: null,
        nama_produk: '',
        keterangan: '',
        harga: '',
        diskon: '',
        harga_diskon: '',
    });

    const handleImageChange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({ ...prev, gambar: file }));
            setPreview(URL.createObjectURL(file)); // preview sebelum upload
        }
    };

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
                id: formData.id,
                id_outlet: outlet.id,
                id_kategori: formData.id_kategori,
                gambar: formData.gambar,
                nama_produk: formData.nama_produk,
                keterangan: formData.keterangan,
                harga: formData.harga,
                diskon: formData.diskon,
                harga_diskon: formData.harga_diskon,
            };

            router.post('/produk', dataToSend, {
                onSuccess: () => {
                    setShowForm(false);
                    setFormData({
                        id: null,
                        id_outlet: null,
                        id_kategori: null,
                        kategori: '',
                        gambar: null,
                        nama_produk: '',
                        keterangan: '',
                        harga: '',
                        diskon: '',
                        harga_diskon: '',
                    });
                    setPreview(null);
                },
                onError: (errors) => {
                    console.log(errors);
                },
            });

            // Refresh produk table after create
            if (fetchProdukRef.current) fetchProdukRef.current();
        } catch (err) {
            setError('Gagal menambah produk');
            // Tampilkan error detail dari backend jika ada
            console.log('Error response:', err);
        }
    };

    // UPDATE
    const handleUpdate = async (e: any) => {
        e.preventDefault();
        try {
            const dataToSend = {
                id: formData.id,
                id_outlet: outlet.id,
                id_kategori: formData.id_kategori,
                gambar: formData.gambar,
                nama_produk: formData.nama_produk,
                keterangan: formData.keterangan,
                harga: formData.harga,
                diskon: formData.diskon,
                harga_diskon: formData.harga_diskon,
            };

            console.log('data yang diupdate :', dataToSend);
            router.put(`/produk/${formData.id}`, dataToSend);

            setShowForm(false);
            setEditId(null);
            setFormData({
                id: null,
                id_outlet: null,
                id_kategori: null,
                kategori: '',
                gambar: null,
                nama_produk: '',
                keterangan: '',
                harga: '',
                diskon: '',
                harga_diskon: '',
            });
            setPreview(null);

            if (fetchProdukRef.current) fetchProdukRef.current();
        } catch {
            setError('Gagal mengedit produk');
        }
    };

    // Edit button
    const handleEdit = (item: any) => {
        setEditId(item.id);
        setFormData({
            id: item.id,
            id_outlet: outlet.id,
            id_kategori: item.id_kategori,
            kategori: item.id_kategori?.toString() || '',
            gambar: null,
            nama_produk: item.nama_produk,
            keterangan: item.keterangan,
            harga: item.harga?.toString() || '',
            diskon: item.diskon || '',
            harga_diskon: item.harga_diskon?.toString() || '',
        });
        // Set preview for existing image
        if (item.gambar) {
            setPreview(`/${item.gambar}`);
        }
        setShowForm(true);
    };

    // DELETE
    const handleDelete = async (id: any) => {
        if (!globalThis.confirm('Yakin hapus data ini?')) return;
        try {
            router.delete(`/produk/${id}`);

            setShowForm(false);
            setEditId(null);
            setFormData({
                id: null,
                id_outlet: null,
                id_kategori: null,
                kategori: '',
                gambar: null,
                nama_produk: '',
                keterangan: '',
                harga: '',
                diskon: '',
                harga_diskon: '',
            });
            setPreview(null);

            if (fetchProdukRef.current) fetchProdukRef.current();
        } catch {
            setError('Gagal menghapus produk');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produk" />
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
                        Kelola Produk {outlet.nama_outlet}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Tambah, edit, atau hapus produk.
                    </p>
                </div>
                {/* Error alert */}
                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                {/* Card: Form Tambah/Edit */}
                <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            {editId ? 'Edit Produk' : 'Tambah Produk'}
                        </h2>
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(!showForm);
                                setEditId(null);
                                setFormData({
                                    id: null,
                                    id_outlet: null,
                                    id_kategori: null,
                                    kategori: '',
                                    gambar: null,
                                    nama_produk: '',
                                    keterangan: '',
                                    harga: '',
                                    diskon: '',
                                    harga_diskon: '',
                                });
                                setPreview(null);
                                setError('');
                            }}
                            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none sm:text-base dark:focus:ring-offset-gray-900"
                        >
                            {showForm ? (
                                <>
                                    <XMarkIcon className="h-5 w-5" />
                                    Tutup Form
                                </>
                            ) : (
                                <>
                                    <PlusIcon className="h-5 w-5" />
                                    Tambah Produk
                                </>
                            )}
                        </button>
                    </div>
                    {showForm && (
                        <form
                            onSubmit={editId ? handleUpdate : handleCreate}
                            className="divide-y divide-gray-200 dark:divide-gray-700"
                        >
                            {/* <div className="flex flex-wrap items-end gap-4"> */}
                            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:gap-6 sm:p-6">
                                <div>
                                    <label
                                        htmlFor="kategori"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Kategori
                                    </label>
                                    <select
                                        id="kategori"
                                        name="kategori"
                                        value={formData.kategori}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {kategoris.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.kategori}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label
                                        htmlFor="nama_outlet"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Gambar Produk
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
                                </div>
                                <div>
                                    <label
                                        htmlFor="nama_outlet"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Nama Produk
                                    </label>
                                    <input
                                        type="text"
                                        id="nama_produk"
                                        name="nama_produk"
                                        value={formData.nama_produk}
                                        onChange={handleChange}
                                        placeholder="Contoh: Lenovo"
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="harga"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Harga (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        id="harga"
                                        name="harga"
                                        value={formData.harga}
                                        onChange={handleChange}
                                        placeholder="0"
                                        required
                                        min="0"
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="diskon"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Diskon
                                    </label>
                                    <select
                                        id="diskon"
                                        name="diskon"
                                        value={formData.diskon}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="">Pilih Diskon</option>
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                    </select>
                                </div>
                                <div>
                                    <label
                                        htmlFor="harga_diskon"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Harga Diskon (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        id="harga_diskon"
                                        name="harga_diskon"
                                        value={formData.harga_diskon}
                                        onChange={handleChange}
                                        placeholder="0"
                                        min="0"
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    />
                                </div>
                            </div>
                            <div>
                                <label
                                    htmlFor="keterangan"
                                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Keterangan
                                </label>
                                <textarea
                                    id="keterangan"
                                    name="keterangan"
                                    value={formData.keterangan}
                                    onChange={handleChange}
                                    placeholder="Opsional"
                                    className="h-100 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>
                            <button
                                type="submit"
                                className="mt-4 shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                            >
                                {editId ? 'Simpan Perubahan' : 'Tambah'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Card: Tabel Kategori */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            Daftar Produk di Outlet Saya
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Total:{' '}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {jmlProduk}
                            </span>{' '}
                            Produk
                        </span>
                    </div>

                    {/* Mobile: Card View */}
                    <div className="md:hidden">
                        {produk.length === 0 ? (
                            <div className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                Belum ada data produk.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {produk.map((item) => (
                                    <div
                                        key={item.id}
                                        className="space-y-4 px-5 py-6 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                    >
                                        <div className="flex items-start gap-4">
                                            {item.gambar ? (
                                                <img
                                                    src={`/${item.gambar}`}
                                                    alt={item.nama_produk}
                                                    className="h-16 w-16 rounded-lg object-cover sm:h-20 sm:w-20"
                                                />
                                            ) : (
                                                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-200 text-xs text-gray-500 sm:h-20 sm:w-20 dark:bg-gray-700 dark:text-gray-400">
                                                    No Image
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                                                    {item.kategori?.kategori}
                                                </p>
                                                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                                    {item.nama_produk}
                                                </h3>
                                                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                                                    {item.diskon === 'yes' ? (
                                                        <>
                                                            <span className="mr-2 text-red-500 line-through">
                                                                {formatRupiah(
                                                                    item.harga,
                                                                )}
                                                            </span>
                                                            <span>
                                                                {formatRupiah(
                                                                    item.harga_diskon,
                                                                )}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span>
                                                            {formatRupiah(
                                                                item.harga,
                                                            )}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() =>
                                                        handleEdit(item)
                                                    }
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
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desktop & Tablet: Table view */}
                    <div className="hidden md:block">
                        <div className="overflow-x-scroll">
                            <table className="w-full" id="tabel_produk">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700/50">
                                        <th className="w-20 px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                            No
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                            Kategori
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                            Gambar Produk
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                            Nama Produk
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                            Harga
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                            Diskon
                                        </th>
                                        <th className="w-40 px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                            Harga Diskon
                                        </th>
                                        <th className="w-40 px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                            Keterangan
                                        </th>
                                        <th className="w-40 px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {produk.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                                            >
                                                Belum ada data outlet. Klik
                                                &quot;Tambah Kategori&quot;
                                                untuk menambah.
                                            </td>
                                        </tr>
                                    ) : (
                                        produk.map((item, nourut) => (
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
                                                    {item.kategori.kategori}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {item.gambar ? (
                                                        <img
                                                            src={`/${item.gambar}`}
                                                            alt={
                                                                item.nama_produk
                                                            }
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
                                                    {item.nama_produk?.length > 50 ? item.nama_produk.slice(0,10,) + '...': item.nama_produk}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {formatRupiah(item.harga)}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {item.diskon}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {formatRupiah(
                                                        item.harga_diskon,
                                                    )}
                                                </td>
                                                <td className="max-w-xs px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {item.keterangan?.length >
                                                    200
                                                        ? item.keterangan.slice(
                                                              0,
                                                              50,
                                                          ) + '...'
                                                        : item.keterangan}
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleEdit(item)
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                                            title="Edit"
                                                        >
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                            Edit Produk
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
                                                            Hapus Produk
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

                    {/* Pagination */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
                                disabled={page === 1}
                                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                                Sebelumnya
                            </button>
                            <span className="px-2 text-sm text-gray-600 dark:text-gray-400">
                                Halaman {page} dari {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setPage((p) => (p < totalPages ? p + 1 : p))
                                }
                                disabled={page >= totalPages}
                                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}

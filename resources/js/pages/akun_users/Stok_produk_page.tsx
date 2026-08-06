import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import React, { useState, useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Kategori {
    id: number;
    kategori: string;
}

interface Produk {
    id: number;
    nama_produk: string;
}

interface Outlet {
    id: number;
    nama_outlet: string;
}

interface StokPageProps extends InertiaPageProps {
    outlet?: Outlet;
    kategoris?: Kategori[];
    produks?: Produk[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Stok',
        href: '/stok',
    },
];

export default function Stok_produk_page() {
    const { outlet, kategoris: rawKategoris } =
        usePage<StokPageProps>().props ?? {};
    const kategoris = rawKategoris ?? [];

    const [error, setError] = useState('');
    const [editId, setEditId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState<{
        id: number | null;
        tgl_transaksi: string;
        id_user: number | null;
        id_outlet: number | null;
        id_kategori: number | null;
        id_produk: number | null;
        kategori: string;
        nama_produk: string;
        jenis_transaksi: string;
        jumlah_produk: number | null;
        harga: string;
        diskon: string;
        keterangan: string;
        gambar: File | null;
    }>({
        id: null,
        tgl_transaksi: '',
        id_user: null,
        id_outlet: null,
        id_kategori: null,
        id_produk: null,
        kategori: '',
        nama_produk: '',
        jenis_transaksi: '',
        jumlah_produk: null,
        harga: '',
        diskon: '',
        keterangan: '',
        gambar: null,
    });

    const resetForm = useCallback(() => {
        setShowForm(false);
        setEditId(null);
        setFormData({
            id: null,
            tgl_transaksi: '',
            id_user: null,
            id_outlet: null,
            id_kategori: null,
            id_produk: null,
            kategori: '',
            nama_produk: '',
            jenis_transaksi: '',
            jumlah_produk: null,
            harga: '',
            diskon: '',
            keterangan: '',
            gambar: null,
        });
        setPreview(null);
        setError('');
    }, []);

    const handleImageChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                setFormData((prev) => ({ ...prev, gambar: file }));
                setPreview(URL.createObjectURL(file));
            }
        },
        [],
    );

    const handleChange = useCallback(
        (
            e: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >,
        ) => {
            const { name, value } = e.target;
            setFormData((prev) => ({ ...prev, [name]: value }));
        },
        [],
    );

    const handleCreate = useCallback(
        (e: React.SubmitEvent) => {
            e.preventDefault();
            router.post('/stok', formData, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    resetForm();
                },
                onError: (errors) => {
                    console.log(errors);
                },
            });
        },
        [formData, resetForm],
    );

    const handleUpdate = useCallback(
        (e: React.SubmitEvent) => {
            e.preventDefault();
            router.put(`/stok/${formData.id}`, formData, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    resetForm();
                },
            });
        },
        [formData, resetForm],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stok" />
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
                        Kelola Stok {outlet?.nama_outlet || 'Produk'}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Tambah dan edit stok.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            {editId ? 'Edit Stok' : 'Tambah Stok'}
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
                                    Tutup Form
                                </>
                            ) : (
                                <>
                                    <PlusIcon className="h-5 w-5" />
                                    Tambah Stok
                                </>
                            )}
                        </button>
                    </div>

                    {showForm && (
                        <form
                            onSubmit={editId ? handleUpdate : handleCreate}
                            className="divide-y divide-gray-200 p-5 sm:p-6 dark:divide-gray-700"
                        >
                            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
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
                                        htmlFor="gambar"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Gambar Produk
                                    </label>
                                    <input
                                        type="file"
                                        id="gambar"
                                        name="gambar"
                                        onChange={handleImageChange}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
                                        htmlFor="nama_produk"
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
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="jenis_transaksi"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Jenis Transaksi
                                    </label>
                                    <select
                                        id="jenis_transaksi"
                                        name="jenis_transaksi"
                                        value={formData.jenis_transaksi}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="">Pilih Jenis</option>
                                        <option value="IN">
                                            Masuk (Tambah Stok)
                                        </option>
                                        <option value="OUT">
                                            Keluar (Kurangi Stok)
                                        </option>
                                    </select>
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
                                        min="0"
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="jumlah_produk"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Jumlah Produk
                                    </label>
                                    <input
                                        type="number"
                                        id="jumlah_produk"
                                        name="jumlah_produk"
                                        value={formData.jumlah_produk ?? ''}
                                        onChange={handleChange}
                                        placeholder="0"
                                        min="0"
                                        required
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
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="">Pilih Diskon</option>
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-5">
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
                                    rows={3}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>

                            <div className="pt-5">
                                <button
                                    type="submit"
                                    className="mt-4 shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                                >
                                    {editId ? 'Simpan Perubahan' : 'Tambah'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}

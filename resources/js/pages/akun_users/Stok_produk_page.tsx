import {
    PlusIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { Head } from '@inertiajs/react'
import React, {useState} from 'react'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Stok',
        href: '/stok',
    },
];

export default function Stok_produk_page() {
    const [error, setError] = useState('')
    const [editId, setEditId] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [preview, setPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState<{

        id: number | null
        tgl_transaksi: string
        id_user: number| null
        id_outlet: number | null
        id_kategori: number | null
        id_produk: number | null
        name: string
        nama_outlet: string
        kategori: string
        nama_produk: string
        jenis_transaksi: string
        jumlah_produk: number | null


    }>({
        id: null,
        tgl_transaksi: '',
        id_user: null,
        id_outlet: null,
        id_kategori: null,
        id_produk: null,
        name: '',
        nama_outlet: '',
        kategori: '',
        nama_produk: '',
        jenis_transaksi: '',
        jumlah_produk: null
    })

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Stok'/>
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
                        Kelola Stok {outlet.nama_outlet}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Tambah dan edit stok.
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
                            {editId ? 'Edit Stok' : 'Tambah Stok'}
                        </h2>
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(!showForm);
                                setEditId(null);
                                setFormData({
                                    id: null,
                                    tgl_transaksi: '',
                                    id_user: null,
                                    id_outlet: null,
                                    id_kategori: null,
                                    id_produk: null,
                                    name: '',
                                    nama_outlet: '',
                                    kategori: '',
                                    nama_produk: '',
                                    jenis_transaksi: '',
                                    jumlah_produk: null

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
                                    Tambah Stok
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

            </main>
        </AppLayout>

  )
}

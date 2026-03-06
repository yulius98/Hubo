import React, { useState, useEffect, useRef } from "react"
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'
import { Head, usePage } from "@inertiajs/react"
import type { PageProps as InertiaPageProps } from '@inertiajs/core'
import { router } from "@inertiajs/react"
import { produk } from "@/routes"
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    XMarkIcon,
    UserPlusIcon,
    EyeIcon,
} from '@heroicons/react/24/outline'

interface Produk {
    id: number | null,
    id_outlet: number | null,
    id_kategori: number | null,
    kategori: string,
    gambar: string | null,
    nama_produk: string,
    keterangan: string,
    harga: number,
    diskon: string,
    harga_diskon: number,
}

interface ProdukPageProps extends InertiaPageProps {
    produks: Produk[]
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
    produk: any[] | { data: any[] }; // Support both array and paginator object
    kategori: any[];
    jmlProduk: number;
}

const formatRupiah = (value: any) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)

export default function produk_user_page({ outlet, produk: produkPaginated, kategori, jmlProduk }: ProdukUserPageProps) {

    const [error, setError] = useState("")
    const [editId, setEditId] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [totaloutlet, setTotalOutlet] = useState(0)
    const [preview, setPreview] = useState<string | null>(null)
    const { produks: rawProduks } = usePage<ProdukPageProps>().props
    const produks = (rawProduks && 'data' in rawProduks ? rawProduks.data : rawProduks) ?? []
    const kategoris = kategori ?? []
    const fetchProdukRef = useRef<(() => void) | null>(null)
    const totalPages = Math.max(1, Math.ceil(jmlProduk / limit))

    // Extract data array from paginator object
    const produk = Array.isArray(produkPaginated) ? produkPaginated : (produkPaginated?.data || [])


    const [formData, setFormData] = useState<{
        id: number | null,
        id_outlet: number | null,
        id_kategori: number | null,
        kategori: string,
        gambar: File | null,
        nama_produk: string,
        keterangan: string,
        harga: string,
        diskon: string,
        harga_diskon: string,
    }>({
        id: null,
        id_outlet: null,
        id_kategori: null,
        kategori: "",
        gambar: null,
        nama_produk: "",
        keterangan: "",
        harga: "",
        diskon: "",
        harga_diskon: "",

    })

    const handleImageChange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, gambar: file }));
            setPreview(URL.createObjectURL(file)); // preview sebelum upload
        }
    }

    const handleChange = (e:any) => {
        const { name, value } = e.target;
        if (name == 'kategori' ) {
        setFormData(prev => ({ ...prev, kategori: value, id_kategori: value }));
        } else {
        setFormData(prev => ({ ...prev,[name]:value}));
        }

    }

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

        router.post("/produk", dataToSend, {
            onSuccess: () => {
                setShowForm(false);
                setFormData({
                    id: null,
                    id_outlet: null,
                    id_kategori: null,
                    kategori: "",
                    gambar: null,
                    nama_produk: "",
                    keterangan: "",
                    harga: "",
                    diskon: "",
                    harga_diskon: "",
                });
                setPreview(null);
            },
            onError: (errors) => {
                console.log(errors);
            }
        });

        // Refresh produk table after create
        if (fetchProdukRef.current) fetchProdukRef.current()
        } catch (err) {
        setError("Gagal menambah produk")
        // Tampilkan error detail dari backend jika ada
        console.log('Error response:', err)
        }
    }

    // UPDATE
    const handleUpdate = async (e: any) => {
        e.preventDefault()
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
        }

        console.log('data yang diupdate :' ,dataToSend)
        router.put(`/produk/${formData.id}`, dataToSend)

        setShowForm(false)
        setEditId(null)
        setFormData({
            id: null,
            id_outlet: null,
            id_kategori: null,
            kategori: "",
            gambar: null,
            nama_produk: "",
            keterangan: "",
            harga: "",
            diskon: "",
            harga_diskon: "",

        })
        setPreview(null)

        if (fetchProdukRef.current) fetchProdukRef.current()
        } catch {
        setError("Gagal mengedit produk")
        }
    }

    // Edit button
    const handleEdit = (item: any) => {
        setEditId(item.id);
        setFormData({
            id: item.id,
            id_outlet: outlet.id,
            id_kategori: item.id_kategori,
            kategori: item.id_kategori?.toString() || "",
            gambar: null,
            nama_produk: item.nama_produk,
            keterangan: item.keterangan,
            harga: item.harga?.toString() || "",
            diskon: item.diskon || "",
            harga_diskon: item.harga_diskon?.toString() || "",

        })
        // Set preview for existing image
        if (item.gambar) {
            setPreview(`/${item.gambar}`);
        }
        setShowForm(true);
    };


    // DELETE
    const handleDelete = async (id: any) => {
        if (!window.confirm("Yakin hapus data ini?")) return;
        try {

        router.delete(`/produk/${id}`);

        setShowForm(false);
        setEditId(null);
        setFormData({
            id: null,
            id_outlet: null,
            id_kategori: null,
            kategori: "",
            gambar: null,
            nama_produk: "",
            keterangan: "",
            harga: "",
            diskon: "",
            harga_diskon: "",

        });
        setPreview(null);

        if (fetchProdukRef.current) fetchProdukRef.current();
        } catch {
        setError("Gagal menghapus outlet");
        }
    };


    return (
        <AppLayout breadcrumbs={breadcrumbs} >
            <Head title="Produk"/>
        <main className="p-6 max-w-8xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                Kelola Produk {outlet.nama_outlet}
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Tambah, edit, atau hapus produk.
                </p>
            </div>
            {/* Error alert */}
            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                {error}
                </div>
            )}

            {/* Card: Form Tambah/Edit */}
            <div className="mb-8 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {editId ? "Edit Produk" : "Tambah Produk"}
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
                            kategori: "",
                            gambar: null,
                            nama_produk: "",
                            keterangan: "",
                            harga: "",
                            diskon: "",
                            harga_diskon: "",
                        });
                        setPreview(null);
                        setError("");
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                    >
                        {showForm ? (
                        <>
                            <XMarkIcon className="w-5 h-5" />
                            Tutup Form
                        </>
                        ) : (
                        <>
                            <PlusIcon className="w-5 h-5" />
                            Tambah Produk
                        </>
                        )}
                    </button>
                </div>
                {showForm && (
                <form
                    onSubmit={editId ? handleUpdate : handleCreate}
                    className="p-6 pt-4"
                >
                    {/* <div className="flex flex-wrap items-end gap-4"> */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-4">

                        <div>
                            <label htmlFor="kategori" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Kategori
                            </label>
                            <select
                                id="kategori"
                                name="kategori"
                                value={formData.kategori}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="">Pilih Kategori</option>
                                {kategoris.map((item) => (
                                <option key={item.id} value={item.id}>{item.kategori}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                            htmlFor="nama_outlet"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                            >
                                Gambar Produk
                            </label>
                            <input
                                type="file"
                                id="gambar"
                                name="gambar"
                                onChange={handleImageChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors"
                            />
                            {preview && (
                                <div className="mt-2">
                                    <img src={preview} alt="Preview" className="w-48 h-48 object-cover" />
                                </div>
                            )}
                        </div>
                        <div>
                            <label
                            htmlFor="nama_outlet"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
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
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label htmlFor="harga" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label htmlFor="diskon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Diskon
                            </label>
                            <select
                                id="diskon"
                                name="diskon"
                                value={formData.diskon}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="">Pilih Diskon</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="harga_diskon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="keterangan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Keterangan
                        </label>
                        <textarea
                            id="keterangan"
                            name="keterangan"
                            value={formData.keterangan}
                            onChange={handleChange}
                            placeholder="Opsional"
                            className="w-full h-100 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />

                    </div>
                    <button
                        type="submit"
                        className="mt-4 px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors shrink-0"
                    >
                        {editId ? "Simpan Perubahan" : "Tambah"}
                    </button>

                </form>
                )}
            </div>

            {/* Card: Tabel Kategori */}
            <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Daftar Outlet Saya
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Total:{" "}
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                        {totaloutlet}
                        </span>{" "}
                        Outlet
                    </span>
                </div>
                <div className=" overflow-x-scroll  ">
                    <table className="w-full" id="tabel_produk">
                        <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700/50">
                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-20">
                            No
                            </th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            Kategori
                            </th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            Gambar Produk
                            </th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            Nama Produk
                            </th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            Harga
                            </th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            Diskon
                            </th>
                            <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-40">
                            Harga Diskon
                            </th>
                            <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-40">
                            Keterangan
                            </th>
                            <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-40">
                                Aksi
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {produk.length === 0 ? (
                            <tr>
                            <td
                                colSpan={3}
                                className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-sm"
                            >
                                Belum ada data outlet. Klik &quot;Tambah
                                Kategori&quot; untuk menambah.
                            </td>
                            </tr>
                        ) : (
                            produk.map((item, nourut) => (
                            <tr
                                key={item.id}
                                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                                {(page - 1) * limit + nourut + 1}
                                </td>
                                <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {typeof item.kategori === 'object' && item.kategori !== null ? item.kategori.kategori : item.kategori}
                                </td>
                                <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {item.gambar ? (
                                        <img src={`/${item.gambar}`} alt={item.nama_produk} className="w-20 h-20 object-cover rounded-lg"/>
                                    ) : (
                                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                            <span className="text-gray-400 text-xs">No Image</span>
                                        </div>
                                    )}
                                </td>
                                <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {item.nama_produk}
                                </td>
                                <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {formatRupiah(item.harga)}
                                </td>
                                <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {item.diskon}
                                </td>
                                <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {formatRupiah(item.harga_diskon)}
                                </td>
                                <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {item.keterangan?.length > 200
                                        ? item.keterangan.slice(0, 50) + "..."
                                        : item.keterangan
                                    }
                                </td>

                                <td className="py-4 px-6 text-right">
                                <div className="flex justify-center gap-2">

                                    <button
                                        type="button"
                                        onClick={() => handleEdit(item)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                        title="Edit"
                                    >
                                        <PencilSquareIcon className="w-4 h-4" />
                                        Edit Outlet
                                    </button>


                                    <button
                                        type="button"
                                        onClick={() => handleDelete(item.id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                        title="Hapus"
                                    >
                                        <TrashIcon className="w-4 h-4" />
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
                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">

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
                </div>
            </div>
        </main>
        </AppLayout>


    )

}




import React, { useState, useEffect, useRef } from "react"
import AppLayout from '@/layouts/app-layout'
import { Head, usePage } from '@inertiajs/react'
import type { BreadcrumbItem } from '@/types'
import { router } from "@inertiajs/react";
import { kategori } from '@/routes';
import type { PageProps as InertiaPageProps } from '@inertiajs/core'
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    XMarkIcon,
    UserPlusIcon,
    EyeIcon,
} from '@heroicons/react/24/outline'

interface Kategori {
    id: number,
    id_user: number,
    gambar: string,
    kategori: string,
}

interface KategoriPaginator {
    data: Kategori[]
    current_page: number
    last_page: number
    per_page: number
    total: number
}

interface KategoriPageProps extends InertiaPageProps {
    kategoris: KategoriPaginator | Kategori[]
    jmlKategori: number
    id_user: number

}


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelola Kategori',
        href: kategori().url,
    },
];

export default function kelola_kategori() {
    const [error, setError] = useState("")
    const [editId, setEditId] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const { kategoris: rawKategoris, jmlKategori, id_user } = usePage<KategoriPageProps>().props
    const kategoris = (rawKategoris && 'data' in rawKategoris ? rawKategoris.data : rawKategoris) ?? []
    const page = (rawKategoris && 'data' in rawKategoris ? rawKategoris.current_page : 1)
    const totalPages = (rawKategoris && 'data' in rawKategoris ? rawKategoris.last_page : 1)
    const limit = (rawKategoris && 'data' in rawKategoris ? rawKategoris.per_page : 10)
    const fetchKategoriRef = useRef<(() => void) | null>(null)
    const [formData, setFormData] = useState({
        id: null,
        id_user: null,
        gambar: null,
        kategori: "",
    });

    const handleImageChange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, gambar: file }));
            setPreview(URL.createObjectURL(file)); // preview sebelum upload
        }
    };

    const handleChange = (e:any) => {
        const { name, value } = e.target;
        if (name == 'kategori' ) {
        setFormData(prev => ({ ...prev, kategori: value, id_kategori: value }));
        } else {
        setFormData(prev => ({ ...prev,[name]:value}));
        }

    };

    // CREATE
    const handleCreate = async (e: any) => {
        e.preventDefault();
        try {
        // Tampilkan data yang akan dikirim ke backend
        const dataToSend = {
            id_user: id_user,
            gambar: formData.gambar,
            kategori: formData.kategori,
        };

        router.post("kelola_kategori", dataToSend, {
            onSuccess: () => {
                setShowForm(false);
                setFormData({
                    id: null,
                    id_user: null,
                    gambar: null,
                    kategori: "",
                });
                setPreview(null);
            },
            onError: (errors) => {
                console.log(errors);
            }
        });

        // Refresh produk table after create
        if (fetchKategoriRef.current) fetchKategoriRef.current();
        } catch (err) {
        setError("Gagal menambah kategori");
        // Tampilkan error detail dari backend jika ada
        console.log('Error response:', err);
        }
    };

    // Edit button
    const handleEdit = (item: any) => {
        setEditId(item.id);
        setFormData({
            id: item.id,
            id_user: item.id_user,
            gambar: item.gambar,
            kategori: item.kategori,


        })
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
            id_user: id_user,
            gambar: formData.gambar,
            kategori: formData.kategori,
            _method: 'PUT', // Method spoofing untuk file upload
        };

        router.post(`/kelola_kategori/${formData.id}`, dataToSend, {
            onSuccess: () => {
                setShowForm(false);
                setEditId(null);
                setFormData({
                    id: null,
                    id_user: null,
                    gambar: null,
                    kategori: "",
                });
                setPreview(null);
                if (fetchKategoriRef.current) fetchKategoriRef.current();
            },
            onError: (errors) => {
                console.log('Update errors:', errors);
                setError("Gagal mengedit kategori");
            }
        });
        } catch (err) {
        setError("Gagal mengedit kategori");
        }
    };

    // DELETE
    const handleDelete = async (id: any) => {
        if (!window.confirm("Yakin hapus data ini?")) return;
        try {

        router.delete(`/kelola_kategori/${id}`);

        setShowForm(false);
        setEditId(null);
        setFormData({
            id: null,
            id_user: null,
            gambar: null,
            kategori: "",

        });
        setPreview(null);

        if (fetchKategoriRef.current) fetchKategoriRef.current();
        } catch {
        setError("Gagal menghapus kategori");
        }
    };


    // TAMBAH
    const handleTambahProduk = async (id: any) => {
        router.get(`/kelola_kategori/${id}`);
    };



    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Kelola Kategori'/>
            <main className="p-6 max-w-8xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                    Kelola Kategori
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Tambah, edit, atau hapus kategori.
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
                            {editId ? "Edit Kategori" : "Form Kategori"}
                        </h2>
                        <button
                            type="button"
                            onClick={() => {
                            setShowForm(!showForm);
                            setEditId(null);
                            setFormData({
                                id: null,
                                id_user: null,
                                gambar: null,
                                kategori: "",

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
                                Tambah Kategori
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
                        <div className="flex-1 min-w-[200px]">
                            <label
                                htmlFor="nama_outlet"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                            >
                                Avatar Kategori
                            </label>
                            <input
                                type="file"
                                id="gambar"
                                name="gambar"
                                onChange={handleImageChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors"
                            />
                            {/* {error.gambar && <div className="text-red-500">{errors.image}</div>} */}

                            {preview && (
                                <div className="mt-2">
                                    <img src={preview} alt="Preview" className="w-48 h-48 object-cover" />
                                </div>
                            )}
                            <label
                                htmlFor="nama_outlet"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                            >
                                Kategori
                            </label>
                            <input
                                type="text"
                                id="kategori"
                                name="kategori"
                                value={formData.kategori}
                                onChange={handleChange}
                                placeholder="Contoh: Viva Store"
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors"
                            />

                        </div>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors shrink-0"
                        >
                            {editId ? "Simpan Perubahan" : "Tambah"}
                        </button>
                        </div>
                    </form>
                    )}
                </div>

                {/* Card: Tabel */}
                <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            Daftar Kategori
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Total:{" "}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                            {jmlKategori}
                            </span>{" "}
                            Kategori
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full" id="tabel_produk">
                            <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700/50">
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-20">
                                No
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Avatar Kategori
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Kategori
                                </th>
                                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-40">
                                Aksi
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {kategoris.length === 0 ? (
                                <tr>
                                <td
                                    colSpan={3}
                                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-sm"
                                >
                                    Belum ada data kategori. Klik &quot;Tambah
                                    Kategori&quot; untuk menambah.
                                </td>
                                </tr>
                            ) : (
                                kategoris.map((item, nourut) => (
                                <tr
                                    key={item.id}
                                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                                    {(page - 1) * limit + nourut + 1}
                                    </td>
                                    <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {item.gambar ? (
                                            <img src={`/${item.gambar}`} alt={item.kategori} className="w-20 h-20 object-cover rounded-lg"/>
                                        ) : (
                                            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                                <span className="text-gray-400 text-xs">No Image</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {item.kategori}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleTambahProduk(item.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                            title="Detail"
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                            Tambah Kategori
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleEdit(item)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                            title="Edit"
                                        >
                                            <PencilSquareIcon className="w-4 h-4" />
                                            Edit Kategori
                                        </button>


                                        <button
                                            type="button"
                                            onClick={() => handleDelete(item.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                            title="Hapus"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                            Hapus Kategori
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
                            onClick={() => router.get(kategori().url, { page: Math.max(1, page - 1) }, { preserveState: true })}
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
                            onClick={() => router.get(kategori().url, { page: Math.min(totalPages, page + 1) }, { preserveState: true })}
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

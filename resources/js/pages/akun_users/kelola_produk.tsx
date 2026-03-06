import AppLayout from '@/layouts/app-layout'
import React, { useState, useRef } from "react"
import type { BreadcrumbItem } from '@/types'
import { Head, usePage } from '@inertiajs/react'
import type { PageProps as InertiaPageProps } from '@inertiajs/core'
import { router } from "@inertiajs/react"
import { kelola_produk as kelolaProdukRoute } from '@/routes'
import {
    EyeIcon,
} from '@heroicons/react/24/outline'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelola Produk',
        href: kelolaProdukRoute().url,
    },
];

interface Outlet {
    id: number,
    gambar: string,
    nama_outlet: string
    alamat_outlet: string
    kota: string
    telp: string
}

interface OutletPageProps extends InertiaPageProps {
    outlets: Outlet[]
    jmlOutlet: number
}

export default function kelola_produk() {
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const { outlets: rawOutlets, jmlOutlet } = usePage<OutletPageProps>().props
    const outlets = rawOutlets ?? []

    // TAMBAH PRODUK
    const handleTambahProduk = async (id: any) => {
        router.get(`/produk/${id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Kelola Produk'/>
            <main className="p-6 max-w-8xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                    Kelola Produk
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Pilih Outlet dahulu sebelum melakukan Tambah, Edit, atau Hapus Produk.
                    </p>
                </div>

                {/* Error alert */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                    {error}
                    </div>
                )}

                <div className="mb-8 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Card: Tabel Kategori */}
                    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                Daftar Outlet Saya
                            </h2>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Total:{" "}
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                {jmlOutlet}
                                </span>{" "}
                                Outlet
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
                                Avatar Outlet
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Nama Outlet
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Alamat Outlet
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Kota
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                No Telp
                                </th>
                                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-40">
                                Aksi
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {outlets.length === 0 ? (
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
                                outlets.map((item, nourut) => (
                                <tr
                                    key={item.id}
                                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                                    {(page - 1) * limit + nourut + 1}
                                    </td>
                                    <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {item.gambar ? (
                                            <img src={`/${item.gambar}`} alt={item.nama_outlet} className="w-20 h-20 object-cover rounded-lg"/>
                                        ) : (
                                            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                                <span className="text-gray-400 text-xs">No Image</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {item.nama_outlet}
                                    </td>
                                    <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {item.alamat_outlet}
                                    </td>
                                    <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {item.kota}
                                    </td>
                                    <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {item.telp}
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
                                            Tambah Produk
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

  )
}

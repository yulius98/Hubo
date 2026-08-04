import {
    PlusIcon,
    XMarkIcon,
    EyeIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import React, { useState, useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';
import { kategori } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface Kategori {
    id: number;
    id_user: number;
    gambar: string;
    kategori: string;
    outlets?: { id: number; nama_outlet: string }[];
}

interface KategoriPageProps extends InertiaPageProps {
    kategoris: Kategori[];
    jmlKategori: number;
    id_user: number;
    selectedOutletId: number;
}

interface KategoriFormData {
    id_user: number | null;
    gambar: string | File | null;
    kategori: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelola Kategori',
        href: kategori().url,
    },
];

export default function KelolaKategoriPage() {
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const {
        kategoris,
        jmlKategori,
        id_user,
        selectedOutletId,
    } = usePage<KategoriPageProps>().props;
    const { sidebarOutlets } = usePage().props;
    const selectedOutletName = sidebarOutlets?.find(
        (outlet) => outlet.id === selectedOutletId,
    )?.nama_outlet;

    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectedOutletRef, setSelectedOutletRef] = useState<number | null>(null);

    const [formData, setFormData] = useState<KategoriFormData>({
        id_user: null,
        gambar: null,
        kategori: '',
    });

    if (selectedOutletRef !== selectedOutletId) {
        setSelectedOutletRef(selectedOutletId);
        const preSelected = new Set<number>();
        kategoris.forEach((item) => {
            if (
                selectedOutletId &&
                item.outlets?.some((outlet) => outlet.id === selectedOutletId)
            ) {
                preSelected.add(item.id);
            }
        });
        setSelectedIds(preSelected);
    }

    const resetForm = useCallback(() => {
        setShowForm(false);
        setFormData({
            id_user: null,
            gambar: null,
            kategori: '',
        });
        setPreview(null);
        setError('');
    }, []);

    const handleImageChange = useCallback((e: any) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({ ...prev, gambar: file }));
            setPreview(URL.createObjectURL(file));
        }
    }, []);

    const handleChange = useCallback((e: any) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const toggleSelect = useCallback((id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // TAMBAH KATEGORI
    const handleCreate = useCallback(
        async (e: any) => {
            e.preventDefault();
            try {
                const dataToSend = {
                    id_user: id_user,
                    gambar: formData.gambar,
                    kategori: formData.kategori,
                };

                router.post('kelola_kategori', dataToSend, {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        resetForm();
                    },
                    onError: (errors) => {
                        console.log(errors);
                    },
                });
            } catch (err) {
                setError('Gagal menambah kategori');
                console.log('Error response:', err);
            }
        },
        [id_user, formData, resetForm],
    );

    // SIMPAN KATEGORI YANG DIPILIH UNTUK OUTLET
    const handleSave = useCallback(
        (e: any) => {
            e.preventDefault();
            if (!selectedOutletId) {
                setError('Silakan pilih outlet terlebih dahulu.');
                return;
            }

            router.post(
                'kelola_kategori/save',
                {
                    outlet_id: selectedOutletId,
                    kategori_ids: Array.from(selectedIds),
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        setError('');
                    },
                    onError: (errors) => {
                        console.log('Save errors:', errors);
                        setError('Gagal menyimpan kategori outlet');
                    },
                },
            );
        },
        [selectedOutletId, selectedIds],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Kategori" />
            <main className="max-w-8xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-800 md:text-3xl dark:text-gray-100">
                        Kelola Kategori
                        {selectedOutletName && (
                            <span className="ml-3 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 align-middle text-sm font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                {selectedOutletName}
                            </span>
                        )}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Pilih kategori yang sesuai dengan produk Anda, lalu
                        simpan.
                    </p>
                </div>

                {/* Error alert */}
                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                {/* Card: Daftar Kategori */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            Daftar Kategori
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Total:{' '}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {jmlKategori}
                            </span>{' '}
                            Kategori
                        </span>
                    </div>

                    {!selectedOutletId && (
                        <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                            Silakan pilih outlet terlebih dahulu di sidebar
                            untuk menyimpan kategori.
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full" id="tabel_produk">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700/50">
                                    <th className="w-20 px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        No
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        Avatar Kategori
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        Kategori
                                    </th>
                                    <th className="w-48 px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {kategoris.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            Belum ada data kategori. Klik
                                            &quot;Tambah Kategori&quot; untuk
                                            menambah.
                                        </td>
                                    </tr>
                                ) : (
                                    kategoris.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            className="bg-white transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/50"
                                        >
                                            <td className="px-6 py-4 text-sm text-gray-600 tabular-nums dark:text-gray-400">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.gambar ? (
                                                    <img
                                                        src={`/${item.gambar}`}
                                                        alt={item.kategori}
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
                                                {item.kategori}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-center gap-2">
                                                    {selectedIds.has(item.id) ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleSelect(
                                                                    item.id,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                                                            title="Batalkan pilihan"
                                                        >
                                                            <CheckIcon className="h-4 w-4" />
                                                            Terpilih
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleSelect(
                                                                    item.id,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                                            title="Pilih kategori"
                                                        >
                                                            <EyeIcon className="h-4 w-4" />
                                                            Pilih
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer: Simpan Kategori */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedIds.size} kategori dipilih
                            {selectedOutletName
                                ? ` untuk ${selectedOutletName}`
                                : ''}
                        </span>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!selectedOutletId}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-800"
                        >
                            <CheckIcon className="h-5 w-5" />
                            Save Kategori
                        </button>
                    </div>
                </div>

                {/* Card: Tambah Kategori */}
                <div className="mb-8 mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            Tambah Kategori Baru
                        </h2>
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(!showForm);
                                resetForm();
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
                                    Tambah Kategori
                                </>
                            )}
                        </button>
                    </div>
                    {showForm && (
                        <form onSubmit={handleCreate} className="p-6 pt-4">
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="min-w-[200px] flex-1">
                                    <label
                                        htmlFor="gambar"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Avatar Kategori
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
                                        htmlFor="kategori"
                                        className="mt-4 mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Nama Kategori
                                    </label>
                                    <input
                                        type="text"
                                        id="kategori"
                                        name="kategori"
                                        value={formData.kategori}
                                        onChange={handleChange}
                                        placeholder="Contoh: Elektronik"
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                                >
                                    Tambah
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}

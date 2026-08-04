import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    XMarkIcon,
    UserPlusIcon,
    EllipsisVerticalIcon,
    RectangleStackIcon,
    BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, Head, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useCallback, useRef, useEffect } from 'react';
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

interface ActionDropdownProps {
    readonly item: Outlet;
    readonly open: boolean;
    readonly onToggle: () => void;
    readonly onClose: () => void;
    readonly onProduk: (id: number) => void;
    readonly onStaff: (id: number) => void;
    readonly onEdit: (item: Outlet) => void;
    readonly onDelete: (id: number) => void;
}

function ActionDropdown({
    item,
    open,
    onToggle,
    onClose,
    onProduk,
    onStaff,
    onEdit,
    onDelete,
}: ActionDropdownProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [open, onClose]);

    return (
        <div ref={ref} className="relative inline-block">
            <button
                type="button"
                onClick={onToggle}
                className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
                <EllipsisVerticalIcon className="h-4 w-4" />
                Aksi
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 z-30 mt-2 w-44 origin-top-right overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
                    >
                        <button
                            onClick={() => {
                                onClose();
                                onProduk(item.id);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-blue-900/20"
                        >
                            <RectangleStackIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            Produk
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                onStaff(item.id);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-blue-900/20"
                        >
                            <UserPlusIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            Staff
                        </button>
                        <div className="border-t border-gray-100 dark:border-gray-700" />
                        <button
                            onClick={() => {
                                onClose();
                                onEdit(item);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-yellow-50 dark:text-gray-200 dark:hover:bg-yellow-900/20"
                        >
                            <PencilSquareIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            Edit
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                onDelete(item.id);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                            <TrashIcon className="h-4 w-4" />
                            Hapus
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface OutletModalProps {
    readonly show: boolean;
    readonly onClose: () => void;
    readonly editId: number | null;
    readonly formData: {
        readonly id: number | null;
        readonly gambar: File | null;
        readonly nama_outlet: string;
        readonly alamat_outlet: string;
        readonly kota: string;
        readonly telp: string;
    };
    readonly preview: string | null;
    readonly onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    readonly onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    readonly onSubmit: (e: React.SubmitEvent) => void;
    readonly isSubmitting: boolean;
}

function OutletModal({
    show,
    onClose,
    editId,
    formData,
    preview,
    onImageChange,
    onChange,
    onSubmit,
    isSubmitting,
}: OutletModalProps) {
    const submitLabel = editId ? 'Simpan Perubahan' : 'Tambah Outlet';

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-6 backdrop-blur-sm"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) onClose();
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                        }}
                        className="relative my-auto flex max-h-[calc(100dvh-3rem)] w-full max-w-2xl flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
                    >
                        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {editId ? 'Edit Outlet' : 'Tambah Outlet Baru'}
                            </h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={onSubmit}
                            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4"
                        >
                            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="outlet-gambar"
                                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Foto / Logo Outlet
                                        </label>
                                        <input
                                            id="outlet-gambar"
                                            type="file"
                                            accept="image/*"
                                            onChange={onImageChange}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:file:bg-blue-900/40 dark:file:text-blue-300"
                                        />
                                        {preview && (
                                            <img
                                                src={preview}
                                                alt="Preview"
                                                className="mt-3 h-28 w-28 rounded-lg object-cover shadow-sm sm:h-32 sm:w-32"
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="outlet-nama"
                                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Nama Outlet{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            id="outlet-nama"
                                            type="text"
                                            name="nama_outlet"
                                            value={formData.nama_outlet}
                                            onChange={onChange}
                                            required
                                            placeholder="Masukkan nama outlet"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder-gray-400 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="outlet-alamat"
                                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Alamat Lengkap{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            id="outlet-alamat"
                                            type="text"
                                            name="alamat_outlet"
                                            value={formData.alamat_outlet}
                                            onChange={onChange}
                                            required
                                            placeholder="Masukkan alamat lengkap"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder-gray-400 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="outlet-kota"
                                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Kota / Kabupaten{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            id="outlet-kota"
                                            type="text"
                                            name="kota"
                                            value={formData.kota}
                                            onChange={onChange}
                                            required
                                            placeholder="Masukkan kota atau kabupaten"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder-gray-400 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="outlet-telp"
                                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Nomor Telepon / WA
                                        </label>
                                        <input
                                            id="outlet-telp"
                                            type="tel"
                                            name="telp"
                                            value={formData.telp}
                                            onChange={onChange}
                                            placeholder="Contoh: 0812-3456-7890"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder-gray-400 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="flex items-end pt-2 sm:pt-6">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:py-2.5"
                                        >
                                            {isSubmitting
                                                ? 'Menyimpan...'
                                                : submitLabel}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function Outlet_User_Page() {
    const [error, setError] = useState('');
    const [editId, setEditId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            setFormData((prev) => ({ ...prev, [name]: value }));
        },
        [],
    );

    const resetForm = useCallback(() => {
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
    }, []);

    const openCreateForm = useCallback(() => {
        resetForm();
        setShowForm(true);
    }, [resetForm]);

    const closeForm = useCallback(() => {
        setShowForm(false);
        resetForm();
    }, [resetForm]);

    const handleCreate = useCallback(
        (e: React.SubmitEvent) => {
            e.preventDefault();
            setIsSubmitting(true);
            const data = new FormData();
            if (formData.gambar) data.append('gambar', formData.gambar);
            data.append('nama_outlet', formData.nama_outlet);
            data.append('alamat_outlet', formData.alamat_outlet);
            data.append('kota', formData.kota);
            data.append('telp', formData.telp);

            router.post('myoutlet', data, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    closeForm();
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    console.log(errors);
                    setIsSubmitting(false);
                },
            });
        },
        [formData, closeForm],
    );

    const handleUpdate = useCallback(
        (e: React.SubmitEvent) => {
            e.preventDefault();
            setIsSubmitting(true);
            const data = new FormData();
            data.append('_method', 'PUT');
            if (formData.gambar) data.append('gambar', formData.gambar);
            data.append('nama_outlet', formData.nama_outlet);
            data.append('alamat_outlet', formData.alamat_outlet);
            data.append('kota', formData.kota);
            data.append('telp', formData.telp);

            router.post(`/myoutlet/${formData.id}`, data, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    closeForm();
                    setIsSubmitting(false);
                },
                onError: () => setIsSubmitting(false),
            });
        },
        [formData, closeForm],
    );

    const handleDelete = useCallback((id: number) => {
        if (
            !confirm(
                'Yakin ingin menghapus outlet ini? Semua data terkait akan ikut terhapus.',
            )
        )
            return;
        router.delete(`/myoutlet/${id}`, {
            preserveScroll: true,
            preserveState: true,
        });
    }, []);

    const handleTambahProduk = useCallback(
        (id: number) => router.get(`/produk/${id}`),
        [],
    );
    const handleTambahStaff = useCallback(
        (id: number) => router.get(`/add_staff/${id}`),
        [],
    );

    const handleEdit = useCallback((item: Outlet) => {
        setEditId(item.id);
        setFormData({
            id: item.id,
            gambar: null,
            nama_outlet: item.nama_outlet,
            alamat_outlet: item.alamat_outlet,
            kota: item.kota,
            telp: item.telp,
        });
        setPreview(item.gambar ? `/${item.gambar}` : null);
        setShowForm(true);
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Outlet saya" />

            <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                        Kelola Outlet
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Kelola semua outlet bisnis Anda dalam satu tempat
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
                        {error}
                    </div>
                )}

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <BuildingStorefrontIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                            <div>
                                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                    Daftar Outlet
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total{' '}
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {jmlOutlet}
                                    </span>{' '}
                                    outlet
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={openCreateForm}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none sm:px-5 dark:focus:ring-offset-gray-900"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Tambah Outlet
                        </button>
                    </div>

                    <div className="md:hidden">
                        {outlets.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 px-5 py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                                <BuildingStorefrontIcon className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                                <p>Belum ada data outlet.</p>
                                <button
                                    onClick={openCreateForm}
                                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Tambah outlet sekarang
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {outlets.map((item) => (
                                    <div
                                        key={item.id}
                                        className="space-y-4 px-5 py-5 transition hover:bg-gray-50 dark:hover:bg-gray-700/30"
                                    >
                                        <div className="flex items-start gap-4">
                                            {item.gambar ? (
                                                <img
                                                    src={`/${item.gambar}`}
                                                    alt={item.nama_outlet}
                                                    className="h-14 w-14 shrink-0 rounded-xl object-cover sm:h-16 sm:w-16"
                                                />
                                            ) : (
                                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400 sm:h-16 sm:w-16 dark:bg-gray-700 dark:text-gray-500">
                                                    <BuildingStorefrontIcon className="h-6 w-6" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {item.nama_outlet}
                                                </h3>
                                                <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                                                    {item.alamat_outlet}
                                                </p>
                                                <div className="mt-1 flex gap-4 text-xs text-gray-400 dark:text-gray-500">
                                                    <span>{item.kota}</span>
                                                    <span>{item.telp}</span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 self-center">
                                                <ActionDropdown
                                                    item={item}
                                                    open={
                                                        openDropdownId ===
                                                        item.id
                                                    }
                                                    onToggle={() =>
                                                        setOpenDropdownId(
                                                            (prev) =>
                                                                prev === item.id
                                                                    ? null
                                                                    : item.id,
                                                        )
                                                    }
                                                    onClose={() =>
                                                        setOpenDropdownId(null)
                                                    }
                                                    onProduk={
                                                        handleTambahProduk
                                                    }
                                                    onStaff={handleTambahStaff}
                                                    onEdit={handleEdit}
                                                    onDelete={handleDelete}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="hidden md:block">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700/40">
                                    <tr>
                                        <th className="w-12 px-5 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400">
                                            No
                                        </th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400">
                                            Outlet
                                        </th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400">
                                            Alamat
                                        </th>
                                        <th className="hidden px-5 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase sm:px-6 lg:table-cell dark:text-gray-400">
                                            Kota
                                        </th>
                                        <th className="hidden px-5 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase sm:table-cell sm:px-6 dark:text-gray-400">
                                            Telepon
                                        </th>
                                        <th className="w-28 px-5 py-4 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase sm:w-32 sm:px-6 dark:text-gray-400">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {outlets.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-6 py-16 text-center text-sm text-gray-500 dark:text-gray-400"
                                            >
                                                <BuildingStorefrontIcon className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                                                Belum ada data outlet.
                                            </td>
                                        </tr>
                                    ) : (
                                        outlets.map((item, index) => (
                                            <tr
                                                key={item.id}
                                                className="transition hover:bg-gray-50 dark:hover:bg-gray-700/20"
                                            >
                                                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 sm:px-6 dark:text-gray-400">
                                                    {index + 1}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap sm:px-6">
                                                    <div className="flex items-center gap-3">
                                                        {item.gambar ? (
                                                            <img
                                                                src={`/${item.gambar}`}
                                                                alt={
                                                                    item.nama_outlet
                                                                }
                                                                className="h-10 w-10 shrink-0 rounded-lg object-cover sm:h-12 sm:w-12"
                                                            />
                                                        ) : (
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 sm:h-12 sm:w-12 dark:bg-gray-700 dark:text-gray-500">
                                                                <BuildingStorefrontIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {
                                                                    item.nama_outlet
                                                                }
                                                            </div>
                                                            <div className="text-xs text-gray-400 lg:hidden dark:text-gray-500">
                                                                {item.kota}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="max-w-2xl min-w-72 truncate px-5 py-4 text-sm text-gray-700 sm:px-6 dark:text-gray-300">
                                                    {item.alamat_outlet}
                                                </td>
                                                <td className="hidden px-5 py-4 text-sm whitespace-nowrap text-gray-700 sm:px-6 lg:table-cell dark:text-gray-300">
                                                    {item.kota}
                                                </td>
                                                <td className="hidden px-5 py-4 text-sm whitespace-nowrap text-gray-700 sm:table-cell sm:px-6 dark:text-gray-300">
                                                    {item.telp}
                                                </td>
                                                <td className="px-5 py-4 text-center whitespace-nowrap sm:px-6">
                                                    <ActionDropdown
                                                        item={item}
                                                        open={
                                                            openDropdownId ===
                                                            item.id
                                                        }
                                                        onToggle={() =>
                                                            setOpenDropdownId(
                                                                (prev) =>
                                                                    prev ===
                                                                    item.id
                                                                        ? null
                                                                        : item.id,
                                                            )
                                                        }
                                                        onClose={() =>
                                                            setOpenDropdownId(
                                                                null,
                                                            )
                                                        }
                                                        onProduk={
                                                            handleTambahProduk
                                                        }
                                                        onStaff={
                                                            handleTambahStaff
                                                        }
                                                        onEdit={handleEdit}
                                                        onDelete={handleDelete}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <OutletModal
                show={showForm}
                onClose={closeForm}
                editId={editId}
                formData={formData}
                preview={preview}
                onImageChange={handleImageChange}
                onChange={handleChange}
                onSubmit={editId ? handleUpdate : handleCreate}
                isSubmitting={isSubmitting}
            />
        </AppLayout>
    );
}

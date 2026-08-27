import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search, Store, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Supplier {
    id: number;
    nama: string;
    kontak_person: string | null;
    email: string | null;
    telepon: string | null;
    alamat: string | null;
    catatan: string | null;
    created_at: string;
}

interface SupplierPagination {
    data: Supplier[];
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    current_page: number;
    last_page: number;
    total: number;
}

interface SuppliersProps {
    suppliers: SupplierPagination;
    search: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Pusat',
        href: admin.dashboard().url,
    },
    {
        title: 'Supplier',
        href: admin.suppliers().url,
    },
];

const formatNumber = (value: number): string =>
    new Intl.NumberFormat('id-ID').format(value);

const formatWaktu = (value: string): string =>
    new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

const emptyForm = {
    nama: '',
    kontak_person: '',
    email: '',
    telepon: '',
    alamat: '',
    catatan: '',
};

const inputClass =
    'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

export default function Suppliers({ suppliers, search }: Readonly<SuppliersProps>) {
    const { flash } = usePage().props;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Supplier | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [processing, setProcessing] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState<Supplier | null>(null);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const q = String(formData.get('search') ?? '');
        router.get(
            admin.suppliers().url,
            { search: q },
            { preserveState: true, replace: true },
        );
    };

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const openEdit = (supplier: Supplier) => {
        setEditing(supplier);
        setForm({
            nama: supplier.nama,
            kontak_person: supplier.kontak_person ?? '',
            email: supplier.email ?? '',
            telepon: supplier.telepon ?? '',
            alamat: supplier.alamat ?? '',
            catatan: supplier.catatan ?? '',
        });
        setDialogOpen(true);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        if (editing) {
            router.put(
                admin.suppliers.update({ supplier: editing.id }).url,
                form,
                {
                    onSuccess: () => {
                        setDialogOpen(false);
                        setEditing(null);
                        setForm(emptyForm);
                    },
                    onFinish: () => setProcessing(false),
                },
            );
        } else {
            router.post(
                admin.suppliers.store().url,
                form,
                {
                    onSuccess: () => {
                        setDialogOpen(false);
                        setForm(emptyForm);
                    },
                    onFinish: () => setProcessing(false),
                },
            );
        }
    };

    const confirmDelete = (supplier: Supplier) => {
        setDeleting(supplier);
        setDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (!deleting) return;
        setProcessing(true);
        router.delete(
            admin.suppliers.destroy({ supplier: deleting.id }).url,
            {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setDeleting(null);
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Supplier" />

            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                            <Store className="h-8 w-8 text-indigo-500" />
                            Supplier
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Kelola data supplier
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Supplier
                    </button>
                </div>

                {flash?.success && (
                    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                        {flash.success}
                    </div>
                )}

                {flash?.error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                <div className="mb-6">
                    <form onSubmit={handleSearch} className="relative sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            name="search"
                            defaultValue={search}
                            placeholder="Cari nama supplier..."
                            className={`${inputClass} pr-4 pl-10`}
                        />
                    </form>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatNumber(suppliers.total)} supplier
                        </span>
                    </div>

                    {suppliers.data.length === 0 ? (
                        <div className="px-5 py-16 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700/50">
                                <Store className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Tidak ada supplier ditemukan
                            </p>
                            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                                Coba ubah kata kunci pencarian atau tambah supplier baru.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                                        {[
                                            'Nama',
                                            'Kontak',
                                            'Email',
                                            'Telepon',
                                            'Aksi',
                                        ].map((header) => (
                                            <th
                                                key={header}
                                                scope="col"
                                                className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {suppliers.data.map((supplier) => (
                                        <tr
                                            key={supplier.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                        >
                                            <td className="px-5 py-3.5">
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {supplier.nama}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {supplier.kontak_person ?? '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {supplier.email ?? '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {supplier.telepon ?? '—'}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(supplier)}
                                                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                                                    >
                                                        <Pencil className="inline h-3.5 w-3.5 mr-1" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => confirmDelete(supplier)}
                                                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                                    >
                                                        <Trash2 className="inline h-3.5 w-3.5 mr-1" />
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {suppliers.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-end gap-1 border-t border-gray-200 px-5 py-3.5 dark:border-gray-700">
                            {suppliers.links.map((link, index) => {
                                if (link.url === null) {
                                    return (
                                        <span
                                            key={index}
                                            className="cursor-not-allowed rounded-lg px-2.5 py-1 text-sm text-gray-400 dark:text-gray-600"
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    );
                                }

                                return (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        preserveScroll
                                        className={`rounded-lg px-2.5 py-1 text-sm font-medium transition-colors ${
                                            link.active
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {editing ? 'Edit Supplier' : 'Tambah Supplier'}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                            {editing
                                ? 'Perbarui informasi supplier di bawah ini.'
                                : 'Isi formulir berikut untuk menambahkan supplier baru.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label htmlFor="nama" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Nama <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="nama"
                                type="text"
                                required
                                value={form.nama}
                                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                                className={inputClass}
                                placeholder="Nama supplier"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="kontak_person" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Kontak Person
                                </label>
                                <input
                                    id="kontak_person"
                                    type="text"
                                    value={form.kontak_person}
                                    onChange={(e) => setForm({ ...form, kontak_person: e.target.value })}
                                    className={inputClass}
                                    placeholder="Nama kontak"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className={inputClass}
                                    placeholder="email@contoh.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="telepon" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Telepon
                            </label>
                            <input
                                id="telepon"
                                type="text"
                                value={form.telepon}
                                onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                                className={inputClass}
                                placeholder="08xxxxxxxxxx"
                            />
                        </div>

                        <div>
                            <label htmlFor="alamat" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Alamat
                            </label>
                            <textarea
                                id="alamat"
                                rows={3}
                                value={form.alamat}
                                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                                className={`${inputClass} py-2.5`}
                                placeholder="Alamat lengkap"
                            />
                        </div>

                        <div>
                            <label htmlFor="catatan" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Catatan
                            </label>
                            <textarea
                                id="catatan"
                                rows={3}
                                value={form.catatan}
                                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                                className={`${inputClass} py-2.5`}
                                placeholder="Catatan tambahan"
                            />
                        </div>

                        <DialogFooter>
                            <button
                                type="button"
                                onClick={() => setDialogOpen(false)}
                                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {processing
                                    ? 'Menyimpan...'
                                    : editing
                                        ? 'Simpan Perubahan'
                                        : 'Tambah'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Hapus Supplier
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                            Apakah Anda yakin ingin menghapus{' '}
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                {deleting?.nama}
                            </span>
                            ? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => setDeleteDialogOpen(false)}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={processing}
                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                        >
                            {processing ? 'Menghapus...' : 'Hapus'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, ReceiptText, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

interface Expense {
    id: number;
    kategori: string;
    jumlah: number;
    tanggal: string;
    keterangan: string;
    outlet_id: number | null;
}

interface ExpensePagination {
    data: Expense[];
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    current_page: number;
    last_page: number;
    total: number;
}

interface ExpensesProps {
    expenses: ExpensePagination;
    filters: {
        start_date: string;
        end_date: string;
        kategori: string;
    };
}

interface ExpenseForm {
    kategori: string;
    jumlah: string;
    tanggal: string;
    keterangan: string;
    outlet_id: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Pusat',
        href: admin.dashboard().url,
    },
    {
        title: 'Biaya Operasional',
        href: admin.expenses().url,
    },
];

const KATEGORI_OPTIONS = [
    ['sewa', 'Sewa'],
    ['gaji', 'Gaji'],
    ['listrik', 'Listrik'],
    ['air', 'Air'],
    ['transport', 'Transport'],
    ['lainnya', 'Lainnya'],
] as const;

const KATEGORI_BADGE: Record<string, string> = {
    sewa: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    gaji: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
    listrik:
        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    air: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
    transport:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    lainnya: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);

const formatTanggal = (value: string): string =>
    new Date(value).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

const emptyForm = (): ExpenseForm => ({
    kategori: 'lainnya',
    jumlah: '',
    tanggal: new Date().toISOString().slice(0, 10),
    keterangan: '',
    outlet_id: '',
});

const formFromExpense = (expense: Expense): ExpenseForm => ({
    kategori: expense.kategori,
    jumlah: String(expense.jumlah),
    tanggal: expense.tanggal,
    keterangan: expense.keterangan,
    outlet_id: expense.outlet_id === null ? '' : String(expense.outlet_id),
});

export default function Expenses({
    expenses,
    filters,
}: Readonly<ExpensesProps>) {
    const { flash, errors } = usePage().props;
    const typedErrors = errors as Record<string, string>;
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Expense | null>(null);
    const [form, setForm] = useState<ExpenseForm>(emptyForm());

    const applyFilter = (data: Record<string, string>) => {
        router.get(
            admin.expenses().url,
            { ...filters, ...data },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm());
        setModalOpen(true);
    };

    const openEdit = (expense: Expense) => {
        setEditing(expense);
        setForm(formFromExpense(expense));
        setModalOpen(true);
    };

    const setField = <K extends keyof ExpenseForm>(
        key: K,
        value: ExpenseForm[K],
    ) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const submit = () => {
        const payload = {
            kategori: form.kategori,
            jumlah: Number(form.jumlah),
            tanggal: form.tanggal,
            keterangan: form.keterangan,
            outlet_id: form.outlet_id === '' ? null : Number(form.outlet_id),
        };

        if (editing) {
            router.put(
                admin.expenses.update({ expense: editing.id }).url,
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => setModalOpen(false),
                },
            );
        } else {
            router.post(admin.expenses.store().url, payload, {
                preserveScroll: true,
                onSuccess: () => setModalOpen(false),
            });
        }
    };

    const handleDelete = (expense: Expense) => {
        if (
            window.confirm(
                `Hapus pengeluaran "${expense.keterangan}"? Tindakan ini tidak dapat dibatalkan.`,
            )
        ) {
            router.delete(admin.expenses.destroy({ expense: expense.id }).url, {
                preserveScroll: true,
            });
        }
    };

    const inputClass =
        'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
    const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Biaya Operasional" />

            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                            <ReceiptText className="h-8 w-8 text-indigo-500" />
                            Biaya Operasional
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Catat pengeluaran operasional
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Pengeluaran
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

                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="grid gap-1.5">
                            <label className={labelClass}>Dari Tanggal</label>
                            <input
                                type="date"
                                value={filters.start_date}
                                onChange={(e) =>
                                    applyFilter({ start_date: e.target.value })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <label className={labelClass}>Sampai Tanggal</label>
                            <input
                                type="date"
                                value={filters.end_date}
                                onChange={(e) =>
                                    applyFilter({ end_date: e.target.value })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <label className={labelClass}>Kategori</label>
                            <select
                                value={filters.kategori}
                                onChange={(e) =>
                                    applyFilter({ kategori: e.target.value })
                                }
                                className={inputClass}
                            >
                                <option value="">Semua</option>
                                {KATEGORI_OPTIONS.map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {expenses.total} pengeluaran
                        </span>
                    </div>

                    {expenses.data.length === 0 ? (
                        <div className="px-5 py-16 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700/50">
                                <ReceiptText className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Tidak ada pengeluaran ditemukan
                            </p>
                            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                                Coba ubah filter atau tambah pengeluaran baru.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                                        {[
                                            'Tanggal',
                                            'Kategori',
                                            'Keterangan',
                                            'Jumlah',
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
                                    {expenses.data.map((expense) => (
                                        <tr
                                            key={expense.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                        >
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {formatTanggal(expense.tanggal)}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${KATEGORI_BADGE[expense.kategori] ?? KATEGORI_BADGE.lainnya}`}
                                                >
                                                    {expense.kategori}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-900 dark:text-gray-100">
                                                {expense.keterangan || '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm font-semibold whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                {formatRupiah(expense.jumlah)}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEdit(expense)
                                                        }
                                                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                expense,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
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

                    {expenses.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-end gap-1 border-t border-gray-200 px-5 py-3.5 dark:border-gray-700">
                            {expenses.links.map((link, index) => {
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

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editing
                                ? 'Edit Pengeluaran'
                                : 'Tambah Pengeluaran'}
                        </DialogTitle>
                        <DialogDescription>
                            {editing
                                ? 'Perbarui detail pengeluaran ini.'
                                : 'Isi detail pengeluaran operasional baru.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-1.5">
                            <label className={labelClass}>Kategori</label>
                            <select
                                value={form.kategori}
                                onChange={(e) =>
                                    setField('kategori', e.target.value)
                                }
                                className={inputClass}
                            >
                                {KATEGORI_OPTIONS.map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            {typedErrors.kategori && (
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    {typedErrors.kategori}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="grid gap-1.5">
                                <label className={labelClass}>
                                    Jumlah (Rp)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.jumlah}
                                    onChange={(e) =>
                                        setField('jumlah', e.target.value)
                                    }
                                    className={inputClass}
                                    placeholder="0"
                                />
                                {typedErrors.jumlah && (
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        {typedErrors.jumlah}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-1.5">
                                <label className={labelClass}>Tanggal</label>
                                <input
                                    type="date"
                                    value={form.tanggal}
                                    onChange={(e) =>
                                        setField('tanggal', e.target.value)
                                    }
                                    className={inputClass}
                                />
                                {typedErrors.tanggal && (
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        {typedErrors.tanggal}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <label className={labelClass}>Keterangan</label>
                            <textarea
                                value={form.keterangan}
                                onChange={(e) =>
                                    setField('keterangan', e.target.value)
                                }
                                rows={3}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                placeholder="Catatan pengeluaran"
                            />
                            {typedErrors.keterangan && (
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    {typedErrors.keterangan}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => setModalOpen(false)}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={submit}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                        >
                            {editing
                                ? 'Simpan Perubahan'
                                : 'Tambah Pengeluaran'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

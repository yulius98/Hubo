import {
    TicketIcon,
    PencilIcon,
    TrashIcon,
    PowerIcon,
} from '@heroicons/react/24/outline';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { coupons } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface Coupon {
    id: number;
    code: string;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    min_purchase: number;
    max_discount: number | null;
    valid_from: string | null;
    valid_to: string | null;
    usage_limit: number | null;
    used_count: number;
    is_active: boolean;
    outlet_id: number | null;
    outlet?: { id: number; nama_outlet: string } | null;
}

interface CouponsPageProps extends InertiaPageProps {
    coupons: {
        data: Coupon[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    outlets: { id: number; nama_outlet: string }[];
    selectedOutletId: number;
}

export const formatRupiah = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

interface CouponFormData {
    code: string;
    name: string;
    type: 'percentage' | 'fixed';
    value: string;
    min_purchase: string;
    max_discount: string;
    valid_from: string;
    valid_to: string;
    usage_limit: string;
    outlet_id: number | '';
    is_active: boolean;
}

const emptyForm: CouponFormData = {
    code: '',
    name: '',
    type: 'percentage',
    value: '',
    min_purchase: '0',
    max_discount: '',
    valid_from: '',
    valid_to: '',
    usage_limit: '',
    outlet_id: '',
    is_active: true,
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Voucher', href: coupons().url },
];

export default function CouponsPage() {
    const { coupons: paginator, outlets, selectedOutletId } =
        usePage<CouponsPageProps>().props;

    const [editing, setEditing] = useState<Coupon | null>(null);
    const [showForm, setShowForm] = useState(false);

    const form = useForm<CouponFormData>(emptyForm);

    const openCreate = () => {
        setEditing(null);
        form.reset();
        form.setData('outlet_id', selectedOutletId || '');
        setShowForm(true);
    };

    const openEdit = (coupon: Coupon) => {
        setEditing(coupon);
        form.setData({
            code: coupon.code,
            name: coupon.name,
            type: coupon.type,
            value: String(coupon.value),
            min_purchase: String(coupon.min_purchase),
            max_discount: coupon.max_discount !== null ? String(coupon.max_discount) : '',
            valid_from: coupon.valid_from ?? '',
            valid_to: coupon.valid_to ?? '',
            usage_limit: coupon.usage_limit !== null ? String(coupon.usage_limit) : '',
            outlet_id: coupon.outlet_id ?? '',
            is_active: coupon.is_active,
        });
        setShowForm(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        form.transform((data) => ({
            code: data.code,
            name: data.name,
            type: data.type,
            value: data.value === '' ? 0 : Number(data.value),
            min_purchase: Number(data.min_purchase),
            max_discount: data.max_discount === '' ? null : Number(data.max_discount),
            valid_from: data.valid_from || null,
            valid_to: data.valid_to || null,
            usage_limit: data.usage_limit === '' ? null : Number(data.usage_limit),
            outlet_id: data.outlet_id === '' ? null : Number(data.outlet_id),
            is_active: data.is_active,
        }));

        if (editing) {
            form.put(`/coupons/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowForm(false);
                    setEditing(null);
                },
            });
        } else {
            form.post('/coupons', {
                preserveScroll: true,
                onSuccess: () => setShowForm(false),
            });
        }
    };

    const toggle = (coupon: Coupon) => {
        router.post(`/coupons/${coupon.id}/toggle`, {}, { preserveScroll: true });
    };

    const destroy = (coupon: Coupon) => {
        if (confirm(`Hapus voucher "${coupon.code}"?`)) {
            router.delete(`/coupons/${coupon.id}`, { preserveScroll: true });
        }
    };

    const isActivePeriod = (coupon: Coupon) =>
        (!coupon.valid_from || new Date(coupon.valid_from) <= new Date()) &&
        (!coupon.valid_to || new Date(coupon.valid_to) >= new Date());

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Voucher" />
            <main className="mx-auto max-w-6xl p-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-800 md:text-3xl dark:text-gray-100">
                            Manajemen Voucher
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Buat kupon diskon yang bisa dipakai pelanggan saat
                            checkout.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    >
                        <TicketIcon className="h-5 w-5" />
                        Buat Voucher
                    </button>
                </div>

                {showForm && (
                    <form
                        onSubmit={submit}
                        className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                        <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-100">
                            {editing
                                ? `Edit Voucher: ${editing.code}`
                                : 'Buat Voucher Baru'}
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Kode Voucher *
                                </label>
                                <input
                                    type="text"
                                    value={form.data.code}
                                    onChange={(e) =>
                                        form.setData(
                                            'code',
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="GRATIS10"
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                />
                                {form.errors.code && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                        {form.errors.code}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nama Voucher *
                                </label>
                                <input
                                    type="text"
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    placeholder="Diskon Spesial"
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                />
                                {form.errors.name && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                        {form.errors.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Tipe Diskon *
                                </label>
                                <select
                                    value={form.data.type}
                                    onChange={(e) =>
                                        form.setData(
                                            'type',
                                            e.target.value as
                                                | 'percentage'
                                                | 'fixed',
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                >
                                    <option value="percentage">Persentase (%)</option>
                                    <option value="fixed">Nominal (Rp)</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nilai {form.data.type === 'percentage' ? '(%)' : '(Rp)'} *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={form.data.value}
                                    onChange={(e) =>
                                        form.setData('value', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                />
                                {form.errors.value && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                        {form.errors.value}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Minimal Belanja (Rp) *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.data.min_purchase}
                                    onChange={(e) =>
                                        form.setData('min_purchase', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Maks. Diskon (Rp)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.data.max_discount}
                                    onChange={(e) =>
                                        form.setData('max_discount', e.target.value)
                                    }
                                    placeholder="Opsional"
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Berlaku Dari
                                </label>
                                <input
                                    type="date"
                                    value={form.data.valid_from}
                                    onChange={(e) =>
                                        form.setData('valid_from', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:[color-scheme:dark]"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Berlaku Sampai
                                </label>
                                <input
                                    type="date"
                                    value={form.data.valid_to}
                                    onChange={(e) =>
                                        form.setData('valid_to', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:[color-scheme:dark]"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Batas Pemakaian
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.data.usage_limit}
                                    onChange={(e) =>
                                        form.setData('usage_limit', e.target.value)
                                    }
                                    placeholder="Tanpa batas"
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Outlet
                                </label>
                                <select
                                    value={String(form.data.outlet_id)}
                                    onChange={(e) =>
                                        form.setData(
                                            'outlet_id',
                                            e.target.value
                                                ? Number(e.target.value)
                                                : '',
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                >
                                    <option value="">Semua Outlet</option>
                                    {outlets.map((outlet) => (
                                        <option key={outlet.id} value={outlet.id}>
                                            {outlet.nama_outlet}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end pb-1">
                                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={form.data.is_active}
                                        onChange={(e) =>
                                            form.setData('is_active', e.target.checked)
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    Aktif
                                </label>
                            </div>
                        </div>
                        <div className="mt-5 flex gap-2">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                            >
                                {editing ? 'Simpan Perubahan' : 'Buat Voucher'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="rounded-xl bg-gray-200 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                )}

                {paginator.data.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                        Belum ada voucher. Buat voucher pertama Anda.
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {paginator.data.map((coupon) => {
                            const inPeriod = isActivePeriod(coupon);
                            const usable = coupon.is_active && inPeriod;
                            return (
                                <div
                                    key={coupon.id}
                                    className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${usable ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}
                                            >
                                                <PowerIcon className="h-3 w-3" />
                                                {usable ? 'AKTIF' : 'NONAKTIF'}
                                            </span>
                                            {coupon.outlet && (
                                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                                    {coupon.outlet.nama_outlet}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => toggle(coupon)}
                                                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:text-gray-400 dark:hover:bg-amber-900/30 dark:hover:text-amber-300"
                                                title={coupon.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                            >
                                                <PowerIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEdit(coupon)}
                                                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                                                title="Edit"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => destroy(coupon)}
                                                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                                                title="Hapus"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="mt-3 font-mono text-xl font-bold tracking-wide text-indigo-600 dark:text-indigo-400">
                                        {coupon.code}
                                    </p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                        {coupon.name}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                        {coupon.type === 'percentage'
                                            ? `${coupon.value}%`
                                            : formatRupiah(coupon.value)}
                                        <span className="text-sm font-medium text-gray-400">
                                            {' '}
                                            diskon
                                        </span>
                                    </p>

                                    <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                                        <p>
                                            Min. belanja:{' '}
                                            <span className="font-medium">
                                                {formatRupiah(coupon.min_purchase)}
                                            </span>
                                        </p>
                                        {coupon.max_discount !== null &&
                                            coupon.max_discount > 0 && (
                                                <p>
                                                    Maks. diskon:{' '}
                                                    <span className="font-medium">
                                                        {formatRupiah(coupon.max_discount)}
                                                    </span>
                                                </p>
                                            )}
                                        <p>
                                            Pemakaian:{' '}
                                            <span className="font-medium">
                                                {coupon.used_count}
                                                {coupon.usage_limit !== null
                                                    ? ` / ${coupon.usage_limit}`
                                                    : ' kali'}
                                            </span>
                                        </p>
                                        {(coupon.valid_from || coupon.valid_to) && (
                                            <p>
                                                {coupon.valid_from &&
                                                    `${new Date(coupon.valid_from).toLocaleDateString('id-ID')}`}
                                                {coupon.valid_from &&
                                                    coupon.valid_to &&
                                                    ' — '}
                                                {coupon.valid_to &&
                                                    new Date(coupon.valid_to).toLocaleDateString('id-ID')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </AppLayout>
    );
}
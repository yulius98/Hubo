import { Head, router, usePage } from '@inertiajs/react';
import {
    CreditCard,
    Infinity as InfinityIcon,
    Package,
    Pencil,
    Plus,
    ShieldCheck,
    Store,
    Trash2,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
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

interface Feature {
    key: string;
    label: string;
}

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price_monthly: number;
    max_outlets: number | null;
    max_products: number | null;
    max_staff: number | null;
    trial_days: number;
    is_active: boolean;
    subscriber_count: number;
    features: Feature[];
}

interface PaketProps {
    plans: Plan[];
    feature_catalog: Feature[];
    metrics: {
        totalPlans: number;
        activePlans: number;
        totalSubscribers: number;
        mrr: number;
    };
}

interface PlanForm {
    name: string;
    slug: string;
    description: string;
    price_monthly: string;
    max_outlets: string;
    max_products: string;
    max_staff: string;
    trial_days: string;
    is_active: boolean;
    features: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Pusat',
        href: admin.dashboard().url,
    },
    {
        title: 'Kelola Paket',
        href: admin.paket().url,
    },
];

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);

const formatNumber = (value: number): string =>
    new Intl.NumberFormat('id-ID').format(value);

const quotaLabel = (value: number | null): string =>
    value === null ? 'Tanpa batas' : formatNumber(value);

const emptyForm = (): PlanForm => ({
    name: '',
    slug: '',
    description: '',
    price_monthly: '0',
    max_outlets: '',
    max_products: '',
    max_staff: '',
    trial_days: '14',
    is_active: true,
    features: [],
});

const formFromPlan = (plan: Plan): PlanForm => ({
    name: plan.name,
    slug: plan.slug,
    description: plan.description ?? '',
    price_monthly: String(plan.price_monthly),
    max_outlets: plan.max_outlets === null ? '' : String(plan.max_outlets),
    max_products: plan.max_products === null ? '' : String(plan.max_products),
    max_staff: plan.max_staff === null ? '' : String(plan.max_staff),
    trial_days: String(plan.trial_days),
    is_active: plan.is_active,
    features: plan.features.map((feature) => feature.key),
});

function StatCard({
    title,
    value,
    icon: Icon,
    iconClass,
}: Readonly<{
    title: string;
    value: string;
    icon: typeof Store;
    iconClass: string;
}>) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {title}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {value}
                    </p>
                </div>
                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function PlanModal({
    open,
    onOpenChange,
    editing,
    catalog,
    errors,
}: Readonly<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: Plan | null;
    catalog: Feature[];
    errors: Record<string, string>;
}>) {
    const [form, setForm] = useState<PlanForm>(emptyForm());

    const reset = () => {
        setForm(editing ? formFromPlan(editing) : emptyForm());
    };

    const setField = <K extends keyof PlanForm>(key: K, value: PlanForm[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const toggleFeature = (key: string, checked: boolean) => {
        setField(
            'features',
            checked
                ? [...form.features, key]
                : form.features.filter((feature) => feature !== key),
        );
    };

    const submit = () => {
        const payload = {
            name: form.name.trim(),
            slug: form.slug.trim(),
            description:
                form.description.trim() === '' ? null : form.description.trim(),
            price_monthly: Number(form.price_monthly),
            max_outlets:
                form.max_outlets.trim() === ''
                    ? null
                    : Number(form.max_outlets),
            max_products:
                form.max_products.trim() === ''
                    ? null
                    : Number(form.max_products),
            max_staff:
                form.max_staff.trim() === '' ? null : Number(form.max_staff),
            trial_days: Number(form.trial_days),
            is_active: form.is_active,
            features: form.features,
        };

        if (editing) {
            router.put(admin.paket.update({ plan: editing.id }).url, payload, {
                preserveScroll: true,
                onSuccess: () => onOpenChange(false),
            });
        } else {
            router.post(admin.paket.store().url, payload, {
                preserveScroll: true,
                onSuccess: () => onOpenChange(false),
            });
        }
    };

    const inputClass =
        'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
    const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

    const featuresError =
        errors['features.0'] ??
        errors['features.1'] ??
        errors['features.2'] ??
        errors['features'];

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (next) {
                    reset();
                }
                onOpenChange(next);
            }}
        >
            <DialogContent className="max-h-[calc(100%-2rem)] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {editing
                            ? `Edit Paket: ${editing.name}`
                            : 'Tambah Paket Baru'}
                    </DialogTitle>
                    <DialogDescription>
                        {editing
                            ? 'Perbarui detail, kuota, dan fitur paket ini.'
                            : 'Lengkapi detail paket yang akan ditawarkan ke tenant.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                            <label className={labelClass}>Nama Paket</label>
                            <input
                                value={form.name}
                                onChange={(event) =>
                                    setField('name', event.target.value)
                                }
                                className={inputClass}
                                placeholder="Contoh: Standard"
                            />
                            {errors.name && (
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-1.5">
                            <label className={labelClass}>Slug</label>
                            <input
                                value={form.slug}
                                onChange={(event) =>
                                    setField('slug', event.target.value)
                                }
                                className={inputClass}
                                placeholder="standard (huruf kecil, tanpa spasi)"
                            />
                            {errors.slug && (
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    {errors.slug}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <label className={labelClass}>Deskripsi</label>
                        <textarea
                            value={form.description}
                            onChange={(event) =>
                                setField('description', event.target.value)
                            }
                            rows={2}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            placeholder="Penjelasan singkat paket"
                        />
                        {errors.description && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="grid gap-1.5">
                            <label className={labelClass}>
                                Harga/Bulan (Rp)
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={form.price_monthly}
                                onChange={(event) =>
                                    setField(
                                        'price_monthly',
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                            {errors.price_monthly && (
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    {errors.price_monthly}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-1.5">
                            <label className={labelClass}>Masa Trial</label>
                            <input
                                type="number"
                                min={0}
                                value={form.trial_days}
                                onChange={(event) =>
                                    setField('trial_days', event.target.value)
                                }
                                className={inputClass}
                            />
                            {errors.trial_days && (
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    {errors.trial_days}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {(
                            [
                                ['max_outlets', 'Kuota Outlet'],
                                ['max_products', 'Kuota Produk'],
                                ['max_staff', 'Kuota Staf'],
                            ] as const
                        ).map(([field, label]) => (
                            <div key={field} className="grid gap-1.5">
                                <label className={labelClass}>
                                    {label} (kosong = tanpa batas)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={form[field]}
                                    onChange={(event) =>
                                        setField(field, event.target.value)
                                    }
                                    className={inputClass}
                                />
                                {errors[field] && (
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        {errors[field]}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-2 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <span className={labelClass}>Fitur Paket</span>
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <Checkbox
                                    checked={form.is_active}
                                    onCheckedChange={(checked) =>
                                        setField('is_active', checked === true)
                                    }
                                />
                                Aktif
                            </label>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {catalog.map((feature) => (
                                <label
                                    key={feature.key}
                                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/40"
                                >
                                    <Checkbox
                                        checked={form.features.includes(
                                            feature.key,
                                        )}
                                        onCheckedChange={(checked) =>
                                            toggleFeature(
                                                feature.key,
                                                checked === true,
                                            )
                                        }
                                    />
                                    {feature.label}
                                </label>
                            ))}
                        </div>
                        {featuresError && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                                {featuresError}
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        {editing ? 'Simpan Perubahan' : 'Buat Paket'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function Paket({
    plans,
    feature_catalog,
    metrics,
}: Readonly<PaketProps>) {
    const { flash, errors } = usePage().props;
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Plan | null>(null);

    const hasAnyFeature = useMemo(
        () => plans.some((plan) => plan.features.length > 0),
        [plans],
    );

    const openCreate = () => {
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (plan: Plan) => {
        setEditing(plan);
        setModalOpen(true);
    };

    const toggleActive = (plan: Plan) => {
        router.post(
            admin.paket.toggle({ plan: plan.id }).url,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const handleDelete = (plan: Plan) => {
        if (
            window.confirm(
                `Hapus paket "${plan.name}"? Tindakan ini tidak dapat dibatalkan.`,
            )
        ) {
            router.delete(admin.paket.destroy({ plan: plan.id }).url, {
                preserveScroll: true,
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Paket" />

            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                            <CreditCard className="h-8 w-8 text-indigo-500" />
                            Kelola Paket
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Kelola daftar paket langganan yang ditawarkan ke
                            seluruh tenant
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Paket
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Paket"
                        value={formatNumber(metrics.totalPlans)}
                        icon={CreditCard}
                        iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                    />
                    <StatCard
                        title="Paket Aktif"
                        value={formatNumber(metrics.activePlans)}
                        icon={ShieldCheck}
                        iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                    />
                    <StatCard
                        title="Pelanggan Berlangganan"
                        value={formatNumber(metrics.totalSubscribers)}
                        icon={Users}
                        iconClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400"
                    />
                    <StatCard
                        title="MRR / Bulan"
                        value={formatRupiah(metrics.mrr)}
                        icon={Package}
                        iconClass="bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
                    />
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatNumber(plans.length)} paket tersedia
                        </span>
                    </div>

                    {plans.length === 0 ? (
                        <div className="px-5 py-16 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700/50">
                                <CreditCard className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Belum ada paket
                            </p>
                            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                                Klik "Tambah Paket" untuk membuat paket pertama.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                                        {[
                                            'Paket',
                                            'Harga/Bulan',
                                            'Kuota',
                                            'Trial',
                                            'Fitur',
                                            'Pelanggan',
                                            'Status',
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
                                    {plans.map((plan) => (
                                        <tr
                                            key={plan.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {plan.name}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    /{plan.slug}
                                                </p>
                                                {plan.description && (
                                                    <p className="mt-1 max-w-xs text-xs text-gray-500 dark:text-gray-400">
                                                        {plan.description}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-sm font-semibold whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                {formatRupiah(
                                                    plan.price_monthly,
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Store className="h-3.5 w-3.5 text-indigo-400" />
                                                    {quotaLabel(
                                                        plan.max_outlets,
                                                    )}
                                                </div>
                                                <div className="mt-1 flex items-center gap-1">
                                                    <Package className="h-3.5 w-3.5 text-violet-400" />
                                                    {quotaLabel(
                                                        plan.max_products,
                                                    )}
                                                </div>
                                                <div className="mt-1 flex items-center gap-1">
                                                    <Users className="h-3.5 w-3.5 text-cyan-400" />
                                                    {quotaLabel(plan.max_staff)}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {plan.trial_days > 0
                                                    ? `${plan.trial_days} hari`
                                                    : 'Tanpa trial'}
                                            </td>
                                            <td className="max-w-xs px-5 py-4">
                                                {plan.features.length === 0 ? (
                                                    <span className="text-sm text-gray-400 dark:text-gray-500">
                                                        —
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {plan.features.map(
                                                            (feature) => (
                                                                <span
                                                                    key={
                                                                        feature.key
                                                                    }
                                                                    className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                                                                >
                                                                    {
                                                                        feature.label
                                                                    }
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {formatNumber(
                                                    plan.subscriber_count,
                                                )}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {plan.is_active ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEdit(plan)
                                                        }
                                                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggleActive(plan)
                                                        }
                                                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                                            plan.is_active
                                                                ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30'
                                                                : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30'
                                                        }`}
                                                    >
                                                        {plan.is_active
                                                            ? 'Nonaktifkan'
                                                            : 'Aktifkan'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(plan)
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
                </div>

                {!hasAnyFeature && feature_catalog.length > 0 && (
                    <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                        <InfinityIcon className="mr-1 inline h-3.5 w-3.5" />
                        Kosongkan kolom kuota untuk mengizinkan tanpa batas.
                        Fitur hanya dapat dipilih dari katalog yang tersedia.
                    </p>
                )}

                <PlanModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    editing={editing}
                    catalog={feature_catalog}
                    errors={errors as Record<string, string>}
                />
            </main>
        </AppLayout>
    );
}

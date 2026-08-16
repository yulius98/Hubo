import {
    CheckCircleIcon,
    SparklesIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { paket } from '@/routes';
import { ganti as gantiPaket } from '@/routes/paket';
import type { BreadcrumbItem } from '@/types';

interface PlanItem {
    id: number;
    name: string;
    slug: string;
    price_monthly: number;
    max_outlets: number | null;
    max_products: number | null;
    max_staff: number | null;
    features: string[];
}

interface PaketPageProps extends InertiaPageProps {
    tenant: { id: number; name: string; slug: string; status: string } | null;
    plan: PlanItem | null;
    usage: { outlets: number; products: number; staff: number } | null;
    plans: PlanItem[];
    flash?: { success?: string; error?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Paket Saya',
        href: paket().url,
    },
];

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

export default function PaketSayaPage() {
    const props = usePage<PaketPageProps>().props;
    const { tenant, plan, usage, plans, flash } = props;

    const [processingId, setProcessingId] = useState<number | null>(null);

    const usageBars = [
        {
            label: 'Outlet',
            value: usage?.outlets ?? 0,
            limit: plan?.max_outlets ?? null,
        },
        {
            label: 'Produk',
            value: usage?.products ?? 0,
            limit: plan?.max_products ?? null,
        },
        {
            label: 'Staf',
            value: usage?.staff ?? 0,
            limit: plan?.max_staff ?? null,
        },
    ];

    const handlePilihPaket = (planId: number) => {
        setProcessingId(planId);
        router.post(
            gantiPaket().url,
            { plan_id: planId },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setProcessingId(null),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Paket Saya" />

            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                        Paket Saya
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Kelola paket dan pantau pemakaian kuota bisnis Anda
                        {tenant ? ` — ${tenant.name}` : ''}
                    </p>
                </div>

                {flash?.success && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
                        {flash.error}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-200 px-5 py-4 sm:px-6 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <SparklesIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                        Paket Saat Ini
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {plan
                                            ? plan.name
                                            : 'Belum ada paket aktif'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-5 sm:px-6">
                            {plan ? (
                                <>
                                    <div className="mb-4 flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                            {plan.price_monthly > 0
                                                ? formatRupiah(
                                                      plan.price_monthly,
                                                  )
                                                : 'Gratis'}
                                        </span>
                                        {plan.price_monthly > 0 && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                / bulan
                                            </span>
                                        )}
                                    </div>

                                    <ul className="space-y-2">
                                        {plan.features.length === 0 && (
                                            <li className="text-sm text-gray-500 dark:text-gray-400">
                                                Fitur sesuai paket akan tampil
                                                di sini.
                                            </li>
                                        )}
                                        {plan.features.map((feature) => (
                                            <li
                                                key={feature}
                                                className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                                            >
                                                <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Pilih paket di bawah untuk mengaktifkan
                                    layanan Anda.
                                </p>
                            )}
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-200 px-5 py-4 sm:px-6 dark:border-gray-700">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                Pemakaian Kuota
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Pemakaian saat ini terhadap batas paket Anda
                            </p>
                        </div>

                        <div className="space-y-5 px-5 py-5 sm:px-6">
                            {usageBars.map((bar) => {
                                const limited = bar.limit !== null;
                                const pct =
                                    bar.limit === null
                                        ? 100
                                        : Math.min(
                                              100,
                                              (bar.value / bar.limit) * 100,
                                          );

                                return (
                                    <div key={bar.label}>
                                        <div className="mb-1.5 flex items-center justify-between text-sm">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                {bar.label}
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {bar.value}
                                                {limited
                                                    ? ` / ${bar.limit}`
                                                    : ' / tak terbatas'}
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                            <div
                                                className={`h-full rounded-full transition-all ${
                                                    limited && pct >= 100
                                                        ? 'bg-red-500'
                                                        : limited
                                                          ? 'bg-indigo-500'
                                                          : 'bg-indigo-300 dark:bg-indigo-500/50'
                                                }`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                <section className="mt-8">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Pilih Paket
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Ganti paket kapan saja sesuai kebutuhan bisnis Anda
                        </p>
                    </div>

                    {plans.length === 0 ? (
                        <div className="rounded-xl border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                            Belum ada paket yang tersedia.
                        </div>
                    ) : (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {plans.map((item) => {
                                const isCurrent =
                                    plan?.id === item.id ||
                                    plan?.slug === item.slug;
                                const limited =
                                    item.max_outlets !== null ||
                                    item.max_products !== null ||
                                    item.max_staff !== null;

                                return (
                                    <div
                                        key={item.id}
                                        className={`relative flex flex-col rounded-xl border bg-white p-5 shadow-sm transition dark:bg-gray-800 ${
                                            isCurrent
                                                ? 'border-indigo-500 ring-1 ring-indigo-500 dark:border-indigo-400 dark:ring-indigo-400'
                                                : 'border-gray-200 dark:border-gray-700'
                                        }`}
                                    >
                                        {isCurrent && (
                                            <span className="absolute -top-2.5 right-4 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                                                Paket Saat Ini
                                            </span>
                                        )}
                                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                            {item.name}
                                        </h3>
                                        <div className="mt-1 flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {item.price_monthly > 0
                                                    ? formatRupiah(
                                                          item.price_monthly,
                                                      )
                                                    : 'Gratis'}
                                            </span>
                                            {item.price_monthly > 0 && (
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    / bulan
                                                </span>
                                            )}
                                        </div>

                                        {limited && (
                                            <ul className="mt-4 space-y-1.5">
                                                {item.max_outlets !== null && (
                                                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                        <CheckCircleIcon className="h-4 w-4 shrink-0 text-indigo-500" />
                                                        {item.max_outlets}{' '}
                                                        outlet
                                                    </li>
                                                )}
                                                {item.max_products !== null && (
                                                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                        <CheckCircleIcon className="h-4 w-4 shrink-0 text-indigo-500" />
                                                        {item.max_products}{' '}
                                                        produk
                                                    </li>
                                                )}
                                                {item.max_staff !== null && (
                                                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                        <CheckCircleIcon className="h-4 w-4 shrink-0 text-indigo-500" />
                                                        {item.max_staff} staf
                                                    </li>
                                                )}
                                            </ul>
                                        )}

                                        {item.features.length > 0 && (
                                            <ul className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 dark:border-gray-700">
                                                {item.features
                                                    .slice(0, 4)
                                                    .map((feature) => (
                                                        <li
                                                            key={feature}
                                                            className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                                                        >
                                                            <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                                                            <span className="line-clamp-2">
                                                                {feature}
                                                            </span>
                                                        </li>
                                                    ))}
                                            </ul>
                                        )}

                                        <div className="mt-5 flex-1" />
                                        {isCurrent ? (
                                            <button
                                                type="button"
                                                disabled
                                                className="w-full cursor-default rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-400 dark:border-gray-600 dark:text-gray-500"
                                            >
                                                Paket Aktif
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={
                                                    processingId === item.id
                                                }
                                                onClick={() =>
                                                    handlePilihPaket(item.id)
                                                }
                                                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
                                            >
                                                {processingId === item.id
                                                    ? 'Memproses...'
                                                    : 'Pilih Paket Ini'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {usage &&
                    usage.outlets > 0 &&
                    plan &&
                    plan.max_outlets !== null &&
                    usage.outlets >= plan.max_outlets && (
                        <div className="mt-6 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                            <XCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                            Anda telah mencapai batas outlet pada paket ini.
                            Tambah outlet perlu upgrade ke paket dengan kuota
                            lebih besar.
                        </div>
                    )}
            </div>
        </AppLayout>
    );
}

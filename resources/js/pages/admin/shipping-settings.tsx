import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Eye,
    EyeOff,
    Info,
    KeyRound,
    MapPin,
    Truck,
} from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

interface ShippingConfig {
    api_key: string;
    origin_city_id: string;
    origin_province: string;
}

interface ShippingSettingsProps {
    config: ShippingConfig;
    configured: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Pusat', href: admin.dashboard().url },
    { title: 'Shipping API', href: admin.shippingSettings().url },
];

export default function ShippingSettings({
    config,
    configured,
}: Readonly<ShippingSettingsProps>) {
    const { flash, errors } = usePage().props;
    const typedErrors = errors as Record<string, string>;

    const [apiKey, setApiKey] = useState(config.api_key);
    const [originCityId, setOriginCityId] = useState(config.origin_city_id);
    const [originProvince, setOriginProvince] = useState(config.origin_province);
    const [apiKeyVisible, setApiKeyVisible] = useState(false);

    const hasChanges =
        apiKey !== config.api_key ||
        originCityId !== config.origin_city_id ||
        originProvince !== config.origin_province;

    const submit = () => {
        router.put(
            admin.shippingSettings.update().url,
            {
                api_key: apiKey,
                origin_city_id: originCityId,
                origin_province: originProvince,
            },
            { preserveScroll: true },
        );
    };

    const inputClass =
        'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
    const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Shipping API" />

            <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 sm:mb-8">
                    <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                        <Truck className="h-8 w-8 text-indigo-500" />
                        Shipping API
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Konfigurasi API RajaOngkir untuk pengiriman
                    </p>
                </div>

                {flash?.success && (
                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        {flash.success}
                    </div>
                )}

                {flash?.error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                            Status
                        </h2>
                        {configured ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Sudah Dikonfigurasi
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Belum Dikonfigurasi
                            </span>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-100">
                        Konfigurasi API
                    </h2>

                    <div className="grid gap-4">
                        <div className="grid gap-1.5">
                            <label className={labelClass}>
                                API Key
                                {configured && (
                                    <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                                        (sudah terisi)
                                    </span>
                                )}
                            </label>
                            <div className="relative">
                                <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={apiKeyVisible ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder={
                                        configured
                                            ? 'Kosongkan jika tidak ingin mengubah'
                                            : 'Masukkan API Key RajaOngkir'
                                    }
                                    className="h-10 w-full rounded-xl border border-gray-200 bg-white py-2 pr-10 pl-9 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setApiKeyVisible(!apiKeyVisible)
                                    }
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {apiKeyVisible ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {typedErrors.api_key && (
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    {typedErrors.api_key}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="grid gap-1.5">
                                <label className={labelClass}>
                                    Origin City ID
                                </label>
                                <div className="relative">
                                    <MapPin className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={originCityId}
                                        onChange={(e) =>
                                            setOriginCityId(e.target.value)
                                        }
                                        className="h-10 w-full rounded-xl border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                        placeholder="ID kota asal"
                                    />
                                </div>
                                {typedErrors.origin_city_id && (
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        {typedErrors.origin_city_id}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-1.5">
                                <label className={labelClass}>
                                    Origin Province
                                </label>
                                <div className="relative">
                                    <MapPin className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={originProvince}
                                        onChange={(e) =>
                                            setOriginProvince(e.target.value)
                                        }
                                        className="h-10 w-full rounded-xl border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                        placeholder="Nama provinsi asal"
                                    />
                                </div>
                                {typedErrors.origin_province && (
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        {typedErrors.origin_province}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60"
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={submit}
                            disabled={!hasChanges}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Simpan
                        </button>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800/60 dark:bg-blue-900/10">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-300">
                        <Info className="h-4 w-4" />
                        Tentang RajaOngkir
                    </h3>
                    <ul className="mt-2 space-y-1 text-xs text-blue-700 dark:text-blue-400">
                        <li>
                            RajaOngkir adalah layanan API cek ongkos kirim
                            dengan ribuan kurir di Indonesia.
                        </li>
                        <li>
                            Dapatkan API Key dengan mendaftar di
                            rajaongkir.com (pakai Kurir/Pro).
                        </li>
                        <li>
                            Origin City ID adalah kode kota pengirim, bisa
                            dicari melalui API atau dashboard RajaOngkir.
                        </li>
                        <li>
                            Origin Province diisi nama provinsi tempat kota
                            asal pengiriman berada.
                        </li>
                    </ul>
                </div>
            </main>
        </AppLayout>
    );
}

import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Eye,
    EyeOff,
    Globe,
    KeyRound,
    ShieldCheck,
    Webhook,
} from 'lucide-react';
import { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

interface GatewayInfo {
    gateway: string;
    configured: boolean;
    configured_fields: Record<string, boolean>;
    config: Record<string, string>;
    default_webhook_url: string;
}

interface SettingsProps {
    active_gateway: string | null;
    gateways: GatewayInfo[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Pusat', href: admin.dashboard().url },
    { title: 'Payment Gateway', href: admin.paymentGateway().url },
];

type SecretField = {
    key: string;
    label: string;
    placeholder: string;
};

const XENDIT_FIELDS: SecretField[] = [
    {
        key: 'secret_key',
        label: 'Secret API Key',
        placeholder: 'xnd_development_...',
    },
    {
        key: 'publishable_key',
        label: 'Publishable API Key',
        placeholder: 'xnd_public_development_...',
    },
    {
        key: 'webhook_token',
        label: 'Webhook Verification Token',
        placeholder: 'Token dari Dashboard Xendit',
    },
];

const MIDTRANS_FIELDS: SecretField[] = [
    {
        key: 'server_key',
        label: 'Server Key',
        placeholder: 'SB-Mid-server-...',
    },
    {
        key: 'client_key',
        label: 'Client Key',
        placeholder: 'SB-Mid-client-...',
    },
];

function SecretInput({
    field,
    value,
    onChange,
    hasExisting,
    error,
}: Readonly<{
    field: SecretField;
    value: string;
    onChange: (val: string) => void;
    hasExisting: boolean;
    error?: string;
}>) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="grid gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label}
                {hasExisting && (
                    <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                        (sudah terisi)
                    </span>
                )}
            </label>
            <div className="relative">
                <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={
                        hasExisting
                            ? 'Kosongkan jika tidak ingin mengubah'
                            : field.placeholder
                    }
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white py-2 pr-10 pl-9 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
                <button
                    type="button"
                    onClick={() => setVisible(!visible)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    {visible ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                </button>
            </div>
            {error && (
                <p className="text-xs text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}

export default function AdminSettings({
    active_gateway,
    gateways,
}: Readonly<SettingsProps>) {
    const { flash, errors } = usePage().props;
    const typedErrors = errors as Record<string, string>;

    const [selectedGateway, setSelectedGateway] = useState<string>(
        active_gateway ?? 'xendit',
    );

    const currentGateway =
        gateways.find((g) => g.gateway === selectedGateway) ?? gateways[0];

    const isXendit = selectedGateway === 'xendit';
    const secretFields = isXendit ? XENDIT_FIELDS : MIDTRANS_FIELDS;

    const [mode, setMode] = useState<string>(
        currentGateway.config.mode ?? 'sandbox',
    );
    const [webhookUrl, setWebhookUrl] = useState<string>(
        currentGateway.config.webhook_url ?? currentGateway.default_webhook_url,
    );
    const [merchantId, setMerchantId] = useState<string>(
        currentGateway.config.merchant_id ?? '',
    );

    const [secretValues, setSecretValues] = useState<Record<string, string>>(
        () => {
            const initial: Record<string, string> = {};
            secretFields.forEach((f) => {
                initial[f.key] = '';
            });
            return initial;
        },
    );

    const handleGatewayChange = (gateway: string) => {
        const info = gateways.find((g) => g.gateway === gateway);
        if (!info) return;
        setSelectedGateway(gateway);
        setMode(info.config.mode ?? 'sandbox');
        setWebhookUrl(info.config.webhook_url ?? info.default_webhook_url);
        setMerchantId(info.config.merchant_id ?? '');
        const newSecrets: Record<string, string> = {};
        (gateway === 'xendit' ? XENDIT_FIELDS : MIDTRANS_FIELDS).forEach(
            (f) => {
                newSecrets[f.key] = '';
            },
        );
        setSecretValues(newSecrets);
    };

    const submit = () => {
        const config: Record<string, string> = {
            mode,
            webhook_url: webhookUrl,
        };

        if (!isXendit && merchantId) {
            config.merchant_id = merchantId;
        }

        secretFields.forEach((f) => {
            const val = secretValues[f.key] ?? '';
            if (val) {
                config[f.key] = val;
            }
        });

        router.put(
            admin.paymentGateway.update().url,
            { gateway: selectedGateway, config },
            { preserveScroll: true },
        );
    };

    const inputClass =
        'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payment Gateway Settings" />

            <main className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
                <div className="mb-6 sm:mb-8">
                    <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                        <Globe className="h-8 w-8 text-indigo-500" />
                        Payment Gateway
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Konfigurasi payment gateway untuk transaksi online dan
                        langganan tenant
                    </p>
                </div>

                {flash?.success && (
                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        {flash.success}
                    </div>
                )}

                {active_gateway && (
                    <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:border-indigo-800/60 dark:bg-indigo-900/20 dark:text-indigo-300">
                        <span className="font-semibold">Gateway Aktif:</span>{' '}
                        {active_gateway === 'xendit' ? 'Xendit' : 'Midtrans'}
                    </div>
                )}

                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Pilih Payment Gateway
                    </label>
                    <Select
                        value={selectedGateway}
                        onValueChange={handleGatewayChange}
                    >
                        <SelectTrigger className="mt-2 h-10 w-full rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="xendit">Xendit</SelectItem>
                            <SelectItem value="midtrans">Midtrans</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="mt-3 flex items-center gap-2">
                        {currentGateway.configured ? (
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
                        {currentGateway.gateway === active_gateway && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Aktif
                            </span>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-100">
                        Konfigurasi{' '}
                        {selectedGateway === 'xendit' ? 'Xendit' : 'Midtrans'}
                    </h2>

                    <div className="grid gap-4">
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Mode
                            </label>
                            <Select value={mode} onValueChange={setMode}>
                                <SelectTrigger className="h-10 w-full rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sandbox">
                                        Sandbox (Testing)
                                    </SelectItem>
                                    <SelectItem value="production">
                                        Production (Live)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                {mode === 'sandbox'
                                    ? 'Menggunakan dana virtual untuk testing'
                                    : 'Menggunakan transaksi sungguhan'}
                            </p>
                        </div>

                        {!isXendit && (
                            <div className="grid gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Merchant ID (Opsional)
                                </label>
                                <input
                                    value={merchantId}
                                    onChange={(e) =>
                                        setMerchantId(e.target.value)
                                    }
                                    className={inputClass}
                                    placeholder="ID merchant Midtrans kamu"
                                />
                            </div>
                        )}

                        {secretFields.map((field) => (
                            <SecretInput
                                key={field.key}
                                field={field}
                                value={secretValues[field.key] ?? ''}
                                onChange={(val) =>
                                    setSecretValues((prev) => ({
                                        ...prev,
                                        [field.key]: val,
                                    }))
                                }
                                hasExisting={
                                    currentGateway.configured_fields[
                                        field.key
                                    ] ?? false
                                }
                                error={typedErrors[`config.${field.key}`]}
                            />
                        ))}

                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                <Webhook className="mr-1 inline h-4 w-4" />
                                Webhook URL
                            </label>
                            <input
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                className={inputClass}
                                placeholder={currentGateway.default_webhook_url}
                            />
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                URL endpoint untuk menerima notifikasi status
                                pembayaran dari{' '}
                                {selectedGateway === 'xendit'
                                    ? 'Xendit'
                                    : 'Midtrans'}
                            </p>
                            {typedErrors['config.webhook_url'] && (
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    {typedErrors['config.webhook_url']}
                                </p>
                            )}
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
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Simpan & Aktifkan
                        </button>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800/60 dark:bg-amber-900/10">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                        <ShieldCheck className="h-4 w-4" />
                        Keamanan
                    </h3>
                    <ul className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-400">
                        <li>
                            Semua API key dan token disimpan terenkripsi di
                            database
                        </li>
                        <li>
                            API key tidak akan pernah ditampilkan setelah
                            disimpan
                        </li>
                        <li>
                            Hanya super admin yang dapat mengakses halaman ini
                        </li>
                        <li>
                            Saat mengisi kolom API key, kosongkan jika tidak
                            ingin mengubah nilai yang sudah ada
                        </li>
                    </ul>
                </div>
            </main>
        </AppLayout>
    );
}

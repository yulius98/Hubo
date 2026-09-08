import { Form, Head, router, usePage } from '@inertiajs/react';
import { KeyRound, ShieldAlert, ShieldCheck, Smartphone } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { security } from '@/routes/settings';
import { confirm as confirmRoute, disable as disableRoute, enable as enableRoute, policy as policyRoute } from '@/routes/settings/security';
import type { BreadcrumbItem } from '@/types';

interface SecurityProps {
    enabled: boolean;
    pending_secret: string | null;
    otpauth_url: string | null;
    recovery_codes: string[] | null;
    policy_enforced: boolean;
    can_manage_policy: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Keamanan',
        href: security().url,
    },
];

export default function Security({
    enabled,
    pending_secret,
    otpauth_url,
    recovery_codes,
    policy_enforced,
    can_manage_policy,
}: Readonly<SecurityProps>) {
    const { flash } = usePage().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Keamanan" />

            <h1 className="sr-only">Keamanan</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Autentikasi dua faktor"
                        description="Lindungi akun dengan kode 6 digit dari aplikasi autentikator (TOTP)."
                    />

                    {enabled ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/60 dark:bg-emerald-900/20">
                            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                <ShieldCheck className="h-4 w-4" />
                                2FA aktif
                            </p>
                            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                                Setiap login memerlukan kode dari aplikasi autentikator.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/60 dark:bg-amber-900/20">
                            <p className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                                <ShieldAlert className="h-4 w-4" />
                                2FA belum aktif
                            </p>
                            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                                Disarankan untuk akun pemilik dan admin outlet.
                            </p>
                        </div>
                    )}

                    {typeof flash?.warning === 'string' && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300">
                            {flash.warning}
                        </div>
                    )}

                    {typeof flash?.success === 'string' && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                            {flash.success}
                        </div>
                    )}

                    {recovery_codes && recovery_codes.length > 0 && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 dark:border-emerald-800/60 dark:bg-emerald-900/20">
                            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                Simpan kode pemulihan ini
                            </p>
                            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                                Gunakan salah satu jika Anda kehilangan akses ke aplikasi
                                autentikator. Kode tidak akan ditampilkan lagi.
                            </p>
                            <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                {recovery_codes.map((code) => (
                                    <code
                                        key={code}
                                        className="rounded-lg bg-white/70 px-3 py-2 text-center font-mono text-xs tracking-wider text-emerald-900 dark:bg-gray-900/40 dark:text-emerald-200"
                                    >
                                        {code}
                                    </code>
                                ))}
                            </div>
                        </div>
                    )}

                    {pending_secret ? (
                        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                                <Smartphone className="h-4 w-4 text-indigo-500" />
                                Langkah 1 — Pindai dengan aplikasi autentikator
                            </div>

                            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                                Gunakan aplikasi seperti Google Authenticator atau Authy.
                                Tidak ada kamera? Masukkan kunci rahasia berikut secara manual.
                            </p>

                            {otpauth_url && (
                                <div className="rounded-xl bg-gray-50 p-4 text-center dark:bg-gray-900/40">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Otentikasi URI (untuk pindai lewat tautan):
                                    </p>
                                    <code className="mt-1 block break-all text-xs text-gray-700 dark:text-gray-300">
                                        {otpauth_url}
                                    </code>
                                </div>
                            )}

                            <div>
                                <Label>Kunci rahasia (secret)</Label>
                                <div className="mt-1 rounded-xl bg-gray-50 px-4 py-3 text-center font-mono text-base tracking-[0.3em] text-gray-800 dark:bg-gray-900/40 dark:text-gray-100">
                                    {pending_secret}
                                </div>
                            </div>

                            <Form
                                method="post"
                                action={confirmRoute().url}
                                className="space-y-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="code">
                                                Langkah 2 — Kode 6 digit
                                            </Label>
                                            <Input
                                                id="code"
                                                name="code"
                                                inputMode="numeric"
                                                pattern="\d{6}"
                                                maxLength={6}
                                                placeholder="123456"
                                                required
                                                className="text-center font-mono tracking-[0.4em]"
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={errors.code}
                                            />
                                        </div>

                                        <Button type="submit" disabled={processing}>
                                            <ShieldCheck className="mr-1.5 h-4 w-4" />
                                            Aktifkan 2FA
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </div>
                    ) : (
                        !enabled && (
                            <Button
                                type="button"
                                onClick={() => router.post(enableRoute().url)}
                            >
                                <KeyRound className="mr-1.5 h-4 w-4" />
                                Mulai pengaturan 2FA
                            </Button>
                        )
                    )}

                    {enabled && (
                        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                                <KeyRound className="h-4 w-4 text-gray-400" />
                                Matikan autentikasi dua faktor
                            </div>

                            <Form
                                method="post"
                                action={disableRoute().url}
                                className="space-y-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="disable-code">
                                                Kode 6 digit atau kode pemulihan
                                            </Label>
                                            <Input
                                                id="disable-code"
                                                name="code"
                                                placeholder="123456 atau XXXX-XXXX"
                                                required
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={errors.code}
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={processing}
                                        >
                                            Matikan 2FA
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </div>
                    )}

                    {can_manage_policy && (
                        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                                <ShieldAlert className="h-4 w-4 text-amber-500" />
                                Kebijakan tenant
                            </div>

                            <Form method="put" action={policyRoute().url}>
                                {({ processing }) => (
                                    <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            name="two_fa_required"
                                            value="1"
                                            defaultChecked={policy_enforced}
                                            onChange={(event) =>
                                                router.put(policyRoute().url, {
                                                    two_fa_required: event.target.checked
                                                        ? '1'
                                                        : '0',
                                                })
                                            }
                                            disabled={processing}
                                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>
                                            Wajibkan 2FA untuk semua pemilik &amp; admin.
                                            <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                                                Saat aktif, setiap pemilik/admin harus
                                                menyiapkan 2FA sebelum mengakses platform.
                                            </span>
                                        </span>
                                    </label>
                                )}
                            </Form>
                        </div>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
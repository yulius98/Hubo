import { Form, Head, router, usePage } from '@inertiajs/react';
import { KeyRound, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { index } from '@/routes/api-tokens';
import type { BreadcrumbItem } from '@/types';

interface OutletOption {
    id: number;
    nama_outlet: string;
}

interface ApiAbilityOption {
    key: string;
    label: string;
}

interface ApiToken {
    id: number;
    name: string;
    abilities: string[];
    last_used_at: string | null;
    created_at: string | null;
}

interface ApiIntegrationsProps {
    outlets: OutletOption[];
    tokens: ApiToken[];
    abilities: ApiAbilityOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'API Integrations',
        href: index().url,
    },
];

const formatDate = (value: string | null): string =>
    value
        ? new Date(value).toLocaleString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
          })
        : 'Belum dipakai';

export default function ApiIntegrations({
    outlets,
    tokens,
    abilities,
}: Readonly<ApiIntegrationsProps>) {
    const { flash } = usePage().props;
    const [selectedAbilities, setSelectedAbilities] = useState<string[]>(
        abilities.map((ability) => ability.key),
    );

    const toggleAbility = (key: string) => {
        setSelectedAbilities((current) =>
            current.includes(key)
                ? current.filter((item) => item !== key)
                : [...current, key],
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="API Integrations" />

            <h1 className="sr-only">API Integrations</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="API Integrations"
                        description="Buat token untuk integrasi eksternal (toko, aplikasi POS). Token hanya mengakses satu outlet."
                    />

<div className="mb-6 rounded-xl bg-indigo-50 px-4 py-3 text-xs leading-relaxed text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
                        <p className="font-semibold">Contoh penggunaan</p>
                        <pre className="mt-2 overflow-x-auto rounded-lg bg-white/70 p-3 dark:bg-gray-900/40">
                            {`curl -H "Authorization: Bearer TOKEN"`}
                            <br />
                            {`  https://{host}/api/v1/produk?page=1`}
                        </pre>
                        <p className="mt-2">
                            Endpoint: <code>GET /api/v1/produk</code>,{' '}
                            <code>GET /api/v1/stok</code>,{' '}
                            <code>GET /api/v1/orders</code>,{' '}
                            <code>PATCH /api/v1/orders/{'{id}'}</code>
                            <br />
                            Rate limit: dapat diatur lewat env{' '}
                            <code>API_RATE_LIMIT_PER_MINUTE</code>.
                        </p>
                    </div>

                    {typeof flash?.apiToken === 'string' && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/60 dark:bg-emerald-900/20">
                            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                Token berhasil dibuat: {flash.apiTokenName}
                            </p>
                            <p className="mt-1 break-all font-mono text-xs text-emerald-700 dark:text-emerald-300">
                                {flash.apiToken}
                            </p>
                            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                                Simpan token ini; tidak akan ditampilkan lagi.
                            </p>
                        </div>
                    )}

                    <Form
                        method="post"
                        action={index().url}
                        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nama token</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="mis. POS Toko A"
                                        required
                                    />
                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="outlet_id">Outlet</Label>
                                    <select
                                        id="outlet_id"
                                        name="outlet_id"
                                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-indigo-500"
                                        required
                                    >
                                        {outlets.map((outlet) => (
                                            <option
                                                key={outlet.id}
                                                value={outlet.id}
                                            >
                                                {outlet.nama_outlet}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        className="mt-2"
                                        message={errors.outlet_id}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Akses (scope)</Label>
                                    {abilities.map((ability) => (
                                        <label
                                            key={ability.key}
                                            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                                        >
                                            <input
                                                type="checkbox"
                                                name="abilities[]"
                                                value={ability.key}
                                                checked={selectedAbilities.includes(
                                                    ability.key,
                                                )}
                                                onChange={() =>
                                                    toggleAbility(ability.key)
                                                }
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            {ability.label}
                                        </label>
                                    ))}
                                    <InputError
                                        className="mt-2"
                                        message={errors.abilities}
                                    />
                                </div>

                                <Button type="submit" disabled={processing}>
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    Buat Token
                                </Button>
                            </>
                        )}
                    </Form>

                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                            <KeyRound className="h-4 w-4 text-amber-500" />
                            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                                Token Aktif
                            </h2>
                        </div>

                        {tokens.length === 0 ? (
                            <div className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                Belum ada token API.
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {tokens.map((token) => (
                                    <li
                                        key={token.id}
                                        className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {token.name}
                                            </p>
                                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                {token.abilities
                                                    .map(
                                                        (ability) =>
                                                            ability.split(':')[
                                                                ability.split(
                                                                    ':',
                                                                ).length - 1
                                                            ],
                                                    )
                                                    .join(', ')}
                                                {' · '}Dibuat:{' '}
                                                {formatDate(token.created_at)}
                                                {' · '}Terakhir dipakai:{' '}
                                                {formatDate(token.last_used_at)}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            onClick={() =>
                                                router.delete(index().url, {
                                                    data: {
                                                        token_id: token.id,
                                                    },
                                                })
                                            }
                                        >
                                            <Trash2 className="mr-1.5 h-4 w-4" />
                                            Cabut
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
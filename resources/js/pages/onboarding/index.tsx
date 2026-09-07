import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Form, Head, usePage } from '@inertiajs/react';
import {
    dismiss,
    saveFinish,
    saveOutlet,
    savePlan,
    saveProfile,
    skip,
} from '@/actions/App/Http/Controllers/OnboardingController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type Plan = {
    id: number;
    name: string;
    slug: string;
    price_monthly: number;
    trial_days: number;
    description: string | null;
};

type OnboardingProps = InertiaPageProps & {
    step: number;
    max_step: number;
    company: { id: number; name: string; slug: string; status: string };
    plans: Plan[];
    outlets: Array<{ id: number; nama_outlet: string; slug: string }>;
    settings: {
        konfigurasi_pajak_ppn: string;
        ongkir_kota_default: string;
    };
};

const currency = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

const steps = [
    { number: 1, title: 'Profil bisnis', description: 'Nama, slug, dan alamat usaha' },
    { number: 2, title: 'Pilih paket', description: 'Paket tarif + konfirmasi trial' },
    { number: 3, title: 'Outlet pertama', description: 'Buat outlet toko pertama' },
    { number: 4, title: 'Konfigurasi singkat', description: 'Pajak, ongkir, dan mata uang' },
];

export default function Onboarding() {
    const props = usePage<OnboardingProps>().props;
    const { step } = props;

    return (
        <AppLayout>
            <Head title="Onboarding" />

            <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
                <div className="space-y-2">
                    <Heading
                        title="Selamat datang di Hubo"
                        description="Selesaikan beberapa langkah singkat agar usaha Anda siap digunakan."
                    />

                    <Form {...dismiss.form()} className="inline-block">
                        <Button type="submit" variant="ghost" size="sm">
                            Selesaikan nanti
                        </Button>
                    </Form>
                </div>

                <ol className="flex items-center gap-2" aria-label="Langkah onboarding">
                    {steps.map((item) => (
                        <li
                            key={item.number}
                            className={cn('flex-1 rounded-md border px-3 py-2', {
                                'border-primary bg-primary/5': item.number === step,
                                'border-muted': item.number > step,
                                'border-primary/40': item.number < step,
                            })}
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className={cn('text-sm font-semibold', {
                                        'text-primary': item.number <= step,
                                        'text-muted-foreground': item.number > step,
                                    })}
                                >
                                    {item.number}. {item.title}
                                </span>
                                {item.number < step && (
                                    <Badge variant="secondary" className="ml-auto">
                                        Selesai
                                    </Badge>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>

                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Profil bisnis</CardTitle>
                            <CardDescription>Nama dan identitas usaha Anda di Hubo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...saveProfile.form()} className="space-y-6">
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <label htmlFor="name" className="text-sm font-medium">
                                                Nama usaha
                                            </label>
                                            <input
                                                id="name"
                                                className="mt-1 block w-full rounded-md border-input bg-background text-sm shadow-sm"
                                                defaultValue={props.company.name}
                                                name="name"
                                                required
                                                placeholder="Toko Anda"
                                            />
                                            <InputError className="mt-2" message={errors.name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <label htmlFor="slug" className="text-sm font-medium">
                                                Slug URL
                                            </label>
                                            <input
                                                id="slug"
                                                className="mt-1 block w-full rounded-md border-input bg-background text-sm shadow-sm"
                                                defaultValue={props.company.slug}
                                                name="slug"
                                                required
                                                placeholder="toko-anda"
                                            />
                                            <InputError className="mt-2" message={errors.slug} />
                                        </div>

                                        <div className="grid gap-2">
                                            <label htmlFor="logo" className="text-sm font-medium">
                                                Logo (URL/gambar)
                                            </label>
                                            <input
                                                id="logo"
                                                className="mt-1 block w-full rounded-md border-input bg-background text-sm shadow-sm"
                                                name="logo"
                                                placeholder="storage/companies/logo.webp"
                                            />
                                            <InputError className="mt-2" message={errors.logo} />
                                        </div>

                                        <div className="grid gap-2">
                                            <label htmlFor="alamat_bisnis" className="text-sm font-medium">
                                                Alamat bisnis
                                            </label>
                                            <input
                                                id="alamat_bisnis"
                                                className="mt-1 block w-full rounded-md border-input bg-background text-sm shadow-sm"
                                                name="alamat_bisnis"
                                                placeholder="Alamat utama usaha"
                                            />
                                            <InputError className="mt-2" message={errors.alamat_bisnis} />
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                            <Form {...skip.form()} className="inline-block">
                                                <Button type="submit" variant="ghost" size="sm">
                                                    Lewati
                                                </Button>
                                            </Form>
                                            <Button type="submit" disabled={processing}>
                                                Lanjut ke paket
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                )}

                {step === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Pilih paket</CardTitle>
                            <CardDescription>
                                Mulai dengan trial, lalu pilih paket yang paling sesuai untuk usaha Anda.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...savePlan.form()} className="space-y-6">
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-4">
                                            {props.plans.map((plan) => (
                                                <label
                                                    key={plan.id}
                                                    className="flex cursor-pointer items-start justify-between gap-4 rounded-md border p-4 has-[:checked]:border-primary"
                                                >
                                                    <span className="flex flex-1 items-start gap-3">
                                                        <input
                                                            type="radio"
                                                            name="plan_id"
                                                            value={plan.id}
                                                            defaultChecked={plan.slug === 'gratis'}
                                                            className="mt-1"
                                                        />
                                                        <span>
                                                            <span className="font-semibold">{plan.name}</span>
                                                            <span className="block text-sm text-muted-foreground">
                                                                {plan.description}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    <span className="text-right">
                                                        <span className="block font-semibold">
                                                            {currency(Number(plan.price_monthly))}
                                                            {plan.price_monthly > 0 && (
                                                                <span className="text-xs font-normal text-muted-foreground">
                                                                    /bulan
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            Trial {plan.trial_days} hari
                                                        </span>
                                                    </span>
                                                </label>
                                            ))}
                                            <InputError className="mt-2" message={errors.plan_id} />
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                            <Form {...skip.form()} className="inline-block">
                                                <Button type="submit" variant="ghost" size="sm">
                                                    Lewati
                                                </Button>
                                            </Form>
                                            <Button type="submit" disabled={processing}>
                                                Mulai trial
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                )}

                {step === 3 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Outlet pertama</CardTitle>
                            <CardDescription>Toko fisik atau online pertama Anda.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...saveOutlet.form()} className="space-y-6">
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <label htmlFor="nama_outlet" className="text-sm font-medium">
                                                Nama outlet
                                            </label>
                                            <input
                                                id="nama_outlet"
                                                className="mt-1 block w-full rounded-md border-input bg-background text-sm shadow-sm"
                                                defaultValue={props.outlets[0]?.nama_outlet ?? ''}
                                                name="nama_outlet"
                                                required
                                                placeholder="Toko Utama"
                                            />
                                            <InputError className="mt-2" message={errors.nama_outlet} />
                                        </div>

                                        <div className="grid gap-2">
                                            <label htmlFor="slug" className="text-sm font-medium">
                                                Slug URL (opsional)
                                            </label>
                                            <input
                                                id="slug"
                                                className="mt-1 block w-full rounded-md border-input bg-background text-sm shadow-sm"
                                                name="slug"
                                                placeholder="toko-utama"
                                            />
                                            <InputError className="mt-2" message={errors.slug} />
                                        </div>

                                        <div className="grid gap-2">
                                            <label htmlFor="alamat_outlet" className="text-sm font-medium">
                                                Alamat outlet
                                            </label>
                                            <input
                                                id="alamat_outlet"
                                                className="mt-1 block w-full rounded-md border-input bg-background text-sm shadow-sm"
                                                name="alamat_outlet"
                                                placeholder="Jl. Mawar No. 1"
                                            />
                                            <InputError className="mt-2" message={errors.alamat_outlet} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <label htmlFor="kota" className="text-sm font-medium">
                                                    Kota
                                                </label>
                                                <input
                                                    id="kota"
                                                    className="mt-1 block w-full rounded-md border-input bg-background text-sm shadow-sm"
                                                    name="kota"
                                                    placeholder="Jakarta"
                                                />
                                                <InputError className="mt-2" message={errors.kota} />
                                            </div>
                                            <div className="grid gap-2">
                                                <label htmlFor="telp" className="text-sm font-medium">
                                                    Telepon
                                                </label>
                                                <input
                                                    id="telp"
                                                    className="mt-1 block w-full rounded-md border-input bg-background text-sm shadow-sm"
                                                    name="telp"
                                                    placeholder="021-555-0100"
                                                />
                                                <InputError className="mt-2" message={errors.telp} />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                            <Form {...skip.form()} className="inline-block">
                                                <Button type="submit" variant="ghost" size="sm">
                                                    Lewati
                                                </Button>
                                            </Form>
                                            <Button type="submit" disabled={processing}>
                                                Buat outlet
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                )}

                {step === 4 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Konfigurasi singkat</CardTitle>
                            <CardDescription>Atur default pajak, ongkir, dan mata uang Anda.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...saveFinish.form()} className="space-y-6">
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <label htmlFor="konfigurasi_pajak_ppn" className="text-sm font-medium">
                                                Tarif pajak default (PPN %)
                                            </label>
                                            <Select
                                                defaultValue={props.settings.konfigurasi_pajak_ppn || '11'}
                                                name="konfigurasi_pajak_ppn"
                                            >
                                                <SelectTrigger id="konfigurasi_pajak_ppn">
                                                    <SelectValue placeholder="Pilih tarif pajak" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">10%</SelectItem>
                                                    <SelectItem value="11">11%</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError className="mt-2" message={errors.konfigurasi_pajak_ppn} />
                                        </div>

                                        <div className="grid gap-2">
                                            <label htmlFor="ongkir_kota_default" className="text-sm font-medium">
                                                Kota default pengiriman
                                            </label>
                                            <input
                                                id="ongkir_kota_default"
                                                className="mt-1 block w-full rounded-md border-input bg-background text-sm shadow-sm"
                                                defaultValue={props.settings.ongkir_kota_default}
                                                name="ongkir_kota_default"
                                                placeholder="Jakarta"
                                            />
                                            <InputError className="mt-2" message={errors.ongkir_kota_default} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <label htmlFor="mata_uang" className="text-sm font-medium">
                                                    Mata uang
                                                </label>
                                                <input
                                                    id="mata_uang"
                                                    className="mt-1 block w-full rounded-md border-input bg-background text-sm shadow-sm"
                                                    defaultValue="IDR"
                                                    name="mata_uang"
                                                    maxLength={10}
                                                />
                                                <InputError className="mt-2" message={errors.mata_uang} />
                                            </div>
                                            <div className="grid gap-2">
                                                <label htmlFor="alamat_pengiriman_default" className="text-sm font-medium">
                                                    Alamat kirim default
                                                </label>
                                                <input
                                                    id="alamat_pengiriman_default"
                                                    className="mt-1 block w-full rounded-md border-input bg-background text-sm shadow-sm"
                                                    name="alamat_pengiriman_default"
                                                    placeholder="Jl. Melati No. 1"
                                                />
                                                <InputError className="mt-2" message={errors.alamat_pengiriman_default} />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                            <Form {...skip.form()} className="inline-block">
                                                <Button type="submit" variant="ghost" size="sm">
                                                    Lewati
                                                </Button>
                                            </Form>
                                            <Button type="submit" disabled={processing}>
                                                Mulai
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
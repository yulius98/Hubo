import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Form, Head, usePage } from '@inertiajs/react';
import {
    index as tenantSettingsIndex,
    updateCompany,
    updateOutlet,
} from '@/actions/App/Http/Controllers/Settings/TenantSettingsController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pengaturan Usaha',
        href: tenantSettingsIndex().url,
    },
];

type OutletSettings = {
    id: number;
    nama_outlet: string;
    slug: string;
    logo: string | null;
    banner: string | null;
    jam_buka: string | null;
    mata_uang: string | null;
    alamat_outlet: string | null;
    kota: string | null;
    telp: string | null;
    alamat_pengiriman_default: string | null;
};

type SettingsProps = InertiaPageProps & {
    company: { id: number; name: string; slug: string; status: string };
    settings: {
        logo: string;
        alamat_bisnis: string;
        konfigurasi_pajak_ppn: string;
        ongkir_kota_default: string;
    };
    outlets: OutletSettings[];
    defaults: { ppn: string; kota_default: string };
};

export default function TenantSettings() {
    const props = usePage<SettingsProps>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan Usaha" />

            <h1 className="sr-only">Pengaturan Usaha</h1>

            <SettingsLayout>
                <div className="space-y-12">
                    <section className="space-y-6">
                        <Heading
                            variant="small"
                            title="Profil usaha"
                            description="Nama, slug, dan parameter usaha tingkat tenant"
                        />

                        <Form
                            {...updateCompany.form()}
                            className="space-y-6"
                            options={{
                                preserveScroll: true,
                            }}
                        >
                            {({ processing, recentlySuccessful, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nama usaha</Label>
                                        <Input
                                            id="name"
                                            className="mt-1 block w-full"
                                            defaultValue={props.company.name}
                                            name="name"
                                            required
                                            placeholder="Toko Anda"
                                        />
                                        <InputError className="mt-2" message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="slug">Slug URL</Label>
                                        <Input
                                            id="slug"
                                            className="mt-1 block w-full"
                                            defaultValue={props.company.slug}
                                            name="slug"
                                            required
                                            placeholder="toko-anda"
                                        />
                                        <InputError className="mt-2" message={errors.slug} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="logo">Logo (URL/gambar)</Label>
                                        <Input
                                            id="logo"
                                            className="mt-1 block w-full"
                                            defaultValue={props.settings.logo}
                                            name="logo"
                                            placeholder="storage/companies/logo.webp"
                                        />
                                        <InputError className="mt-2" message={errors.logo} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="alamat_bisnis">Alamat bisnis</Label>
                                        <Input
                                            id="alamat_bisnis"
                                            className="mt-1 block w-full"
                                            defaultValue={props.settings.alamat_bisnis}
                                            name="alamat_bisnis"
                                            placeholder="Alamat utama usaha"
                                        />
                                        <InputError className="mt-2" message={errors.alamat_bisnis} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="konfigurasi_pajak_ppn">Tarif pajak default (PPN %)</Label>
                                        <Select
                                            defaultValue={props.settings.konfigurasi_pajak_ppn || props.defaults.ppn}
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
                                        <Label htmlFor="ongkir_kota_default">Kota default pengiriman</Label>
                                        <Input
                                            id="ongkir_kota_default"
                                            className="mt-1 block w-full"
                                            defaultValue={props.settings.ongkir_kota_default}
                                            name="ongkir_kota_default"
                                            placeholder="Jakarta"
                                        />
                                        <InputError className="mt-2" message={errors.ongkir_kota_default} />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Button type="submit" disabled={processing}>
                                            Simpan
                                        </Button>
                                        {recentlySuccessful && (
                                            <div className="text-sm text-muted-foreground">Tersimpan.</div>
                                        )}
                                    </div>
                                </>
                            )}
                        </Form>
                    </section>

                    <section className="space-y-6">
                        <Heading
                            variant="small"
                            title="Pengaturan outlet"
                            description="Parameter tampilan dan operasional per outlet"
                        />

                        <div className="grid gap-6">
                            {props.outlets.map((outlet) => (
                                <Card key={outlet.id}>
                                    <CardHeader>
                                        <CardTitle>{outlet.nama_outlet}</CardTitle>
                                        <CardDescription>
                                            Slug: {outlet.slug} · {outlet.kota || '—'}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent>
                                        <Form
                                            {...updateOutlet.form({ outlet: outlet.id })}
                                            className="space-y-6"
                                            options={{
                                                preserveScroll: true,
                                            }}
                                        >
                                            {({ processing, errors }) => (
                                                <>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor={`nama_outlet_${outlet.id}`}>Nama outlet</Label>
                                                        <Input
                                                            id={`nama_outlet_${outlet.id}`}
                                                            className="mt-1 block w-full"
                                                            defaultValue={outlet.nama_outlet}
                                                            name="nama_outlet"
                                                            required
                                                        />
                                                        <InputError className="mt-2" message={errors.nama_outlet} />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor={`slug_${outlet.id}`}>Slug URL</Label>
                                                        <Input
                                                            id={`slug_${outlet.id}`}
                                                            className="mt-1 block w-full"
                                                            defaultValue={outlet.slug}
                                                            name="slug"
                                                            required
                                                        />
                                                        <InputError className="mt-2" message={errors.slug} />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor={`logo_${outlet.id}`}>Logo outlet</Label>
                                                        <Input
                                                            id={`logo_${outlet.id}`}
                                                            className="mt-1 block w-full"
                                                            defaultValue={outlet.logo ?? ''}
                                                            name="logo"
                                                            placeholder="storage/outlets/logo.webp"
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor={`banner_${outlet.id}`}>Banner outlet</Label>
                                                        <Input
                                                            id={`banner_${outlet.id}`}
                                                            className="mt-1 block w-full"
                                                            defaultValue={outlet.banner ?? ''}
                                                            name="banner"
                                                            placeholder="storage/outlets/banner.webp"
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor={`jam_buka_${outlet.id}`}>Jam buka</Label>
                                                        <Input
                                                            id={`jam_buka_${outlet.id}`}
                                                            className="mt-1 block w-full"
                                                            defaultValue={outlet.jam_buka ?? ''}
                                                            name="jam_buka"
                                                            placeholder="08.00 - 21.00"
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor={`mata_uang_${outlet.id}`}>Mata uang</Label>
                                                        <Input
                                                            id={`mata_uang_${outlet.id}`}
                                                            className="mt-1 block w-full"
                                                            defaultValue={outlet.mata_uang ?? 'IDR'}
                                                            name="mata_uang"
                                                            maxLength={10}
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor={`alamat_outlet_${outlet.id}`}>Alamat outlet</Label>
                                                        <Input
                                                            id={`alamat_outlet_${outlet.id}`}
                                                            className="mt-1 block w-full"
                                                            defaultValue={outlet.alamat_outlet ?? ''}
                                                            name="alamat_outlet"
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor={`alamat_pengiriman_default_${outlet.id}`}>
                                                            Alamat pengiriman default
                                                        </Label>
                                                        <Input
                                                            id={`alamat_pengiriman_default_${outlet.id}`}
                                                            className="mt-1 block w-full"
                                                            defaultValue={outlet.alamat_pengiriman_default ?? ''}
                                                            name="alamat_pengiriman_default"
                                                            placeholder="Alamat default untuk checkout"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <Button type="submit" disabled={processing}>
                                                            Simpan outlet
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </Form>
                                    </CardContent>
                                </Card>
                            ))}

                            {props.outlets.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada outlet. Buat outlet pertama melalui wizard onboarding.
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
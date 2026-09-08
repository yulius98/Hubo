import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, Database, Download, FileJson } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { index as dataIndex } from '@/routes/data';
import type { BreadcrumbItem } from '@/types';

interface DataProps {
    companyName: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Data',
        href: dataIndex().url,
    },
];

export default function Data({ companyName }: Readonly<DataProps>) {
    const { flash, errors } = usePage().props;
    const [confirmation, setConfirmation] = useState('');

    const destroy = () => {
        if (
            window.confirm(
                'Ini akan menghapus SEMUA data toko Anda secara permanen dan tidak dapat dibatalkan. Lanjutkan?',
            )
        ) {
            router.delete(dataIndex().url, {
                data: { confirmation },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data" />

            <h1 className="sr-only">Data</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Data Toko"
                        description="Unduh salinan lengkap data toko Anda atau hapus seluruh data secara permanen."
                    />

                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-start gap-4">
                            <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                                <Download className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                                    Ekspor data
                                </h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Buat salinan JSON berisi profil usaha, outlet,
                                    katalog, staf, pesanan, pembayaran, dan
                                    transaksi. File siap diunduh ditautkan lewat
                                    notifikasi selama 24 jam.
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                                <FileJson className="h-3.5 w-3.5" />
                                tenant-export-{"{date}"}.json
                            </span>
                            <Button
                                type="button"
                                onClick={() =>
                                    router.post(dataIndex().url + '/export')
                                }
                            >
                                Ekspor sekarang
                            </Button>
                        </div>
                        {typeof flash?.success === 'string' && (
                            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                                {flash.success}
                            </p>
                        )}
                    </section>

                    <section className="rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-900/60 dark:bg-red-950/20">
                        <div className="flex items-start gap-4">
                            <div className="rounded-xl bg-red-100 p-2.5 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h2 className="flex items-center gap-2 text-base font-semibold text-red-700 dark:text-red-300">
                                    <Database className="h-4 w-4" />
                                    Hapus data toko
                                </h2>
                                <p className="mt-1 text-sm text-red-600/80 dark:text-red-300/80">
                                    Hapus secara permanen seluruh data usaha ini
                                    (katalog, pesanan, staf, langganan). Tindakan
                                    ini tidak dapat dibatalkan.
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid max-w-md gap-2">
                            <Label htmlFor="confirmation" className="text-red-700 dark:text-red-300">
                                Ketik <strong className="font-mono">{companyName}</strong> untuk
                                mengonfirmasi
                            </Label>
                            <Input
                                id="confirmation"
                                value={confirmation}
                                onChange={(event) =>
                                    setConfirmation(event.target.value)
                                }
                                placeholder={companyName}
                                autoComplete="off"
                            />
                            <InputError
                                className="mt-2"
                                message={errors.confirmation}
                            />
                            <div className="mt-1">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={
                                        confirmation !== companyName ||
                                        companyName === ''
                                    }
                                    onClick={destroy}
                                >
                                    Hapus permanen
                                </Button>
                            </div>
                        </div>
                    </section>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
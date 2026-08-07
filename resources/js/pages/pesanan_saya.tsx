import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, PackageSearch } from 'lucide-react';
import { useState } from 'react';
import LoadingOverlay from '@/components/loading-overlay';
import { t } from '@/i18n';
import { homepage } from '@/routes';

export default function PesananSaya() {
    const { locale } = usePage().props as unknown as { locale: string };
    const [loading, setLoading] = useState(false);

    const handleBack = () => {
        if (!loading) {
            setLoading(true);
            router.visit(homepage());
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-blue-50 via-white to-blue-100 p-6 text-blue-950 dark:bg-linear-to-br dark:from-blue-950 dark:via-blue-900 dark:to-black dark:text-white">
            <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-blue-200 bg-white/80 p-10 text-center shadow-xl backdrop-blur-xl dark:border-blue-700/40 dark:bg-blue-900/60">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/20 text-cyan-500">
                    <PackageSearch size={32} />
                </div>
                <h1 className="mt-6 bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-2xl font-bold text-transparent">
                    {t('pesanan.title', locale)}
                </h1>
                <p className="mt-2 text-sm text-blue-400 dark:text-blue-300">
                    {t('pesanan.subtitle', locale)}
                </p>
                <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading}
                    className="mt-8 flex cursor-pointer items-center gap-2 rounded-xl border border-blue-400/50 px-5 py-2.5 text-sm font-semibold text-blue-200 transition hover:border-cyan-400 hover:text-cyan-300"
                >
                    <ArrowLeft size={18} />
                    {t('pesanan.back', locale)}
                </button>
            </div>
            <LoadingOverlay show={loading} />
        </div>
    );
}

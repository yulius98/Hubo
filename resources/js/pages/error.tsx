import { Head } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';

const ERROR_META: Record<number, { title: string; description: string }> = {
    403: {
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
    },
    404: {
        title: 'Halaman Tidak Ditemukan',
        description:
            'Halaman yang Anda cari mungkin telah dipindahkan atau tidak lagi tersedia.',
    },
    419: {
        title: 'Sesi Berakhir',
        description: 'Sesi Anda telah berakhir. Silakan muat ulang halaman.',
    },
    500: {
        title: 'Terjadi Kesalahan',
        description: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
    },
    503: {
        title: 'Sedang Pemeliharaan',
        description:
            'Layanan sedang dalam pemeliharaan. Silakan coba lagi beberapa saat.',
    },
};

export default function ErrorPage({
    status,
    message,
}: {
    status?: number;
    message?: string;
}) {
    const statusCode = typeof status === 'number' ? status : 500;
    const meta = ERROR_META[statusCode] ?? ERROR_META[500];
    const hasSpecificMessage = Boolean(message) && message !== meta.description;

    return (
        <>
            <Head title={`${statusCode} · ${meta.title}`} />

            <div className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
                <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="mb-6 flex justify-center">
                        <AppLogo />
                    </div>

                    <p className="text-sm font-semibold tracking-widest text-indigo-600 uppercase dark:text-indigo-400">
                        Error {statusCode}
                    </p>
                    <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {meta.title}
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                        {hasSpecificMessage ? message : meta.description}
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <a
                            href="/"
                            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-900"
                        >
                            Kembali ke Beranda
                        </a>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            Muat Ulang
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

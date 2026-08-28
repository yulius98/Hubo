import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Variant {
    id: number;
    nama: string;
    sku: string | null;
    harga: number | null;
    stok: number;
    is_active: boolean;
}

interface Product {
    id: number | null;
    nama_produk: string;
    variants?: Variant[];
}

interface VariantManagerModalProps {
    product: Product;
    onClose: () => void;
}

const emptyForm = { nama: '', sku: '', harga: '', stok: '0', is_active: true };

export default function VariantManagerModal({ product, onClose }: VariantManagerModalProps) {
    const [editing, setEditing] = useState<Variant | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');

    useEffect(() => {
        const closeOnEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [onClose]);

    const resetForm = () => {
        setEditing(null);
        setForm(emptyForm);
        setError('');
    };

    const openEdit = (variant: Variant) => {
        setEditing(variant);
        setForm({
            nama: variant.nama,
            sku: variant.sku ?? '',
            harga: variant.harga !== null ? String(variant.harga) : '',
            stok: String(variant.stok),
            is_active: variant.is_active,
        });
        setError('');
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!product.id) return;

        const payload = {
            nama: form.nama,
            sku: form.sku || null,
            harga: form.harga !== '' ? Number(form.harga) : null,
            stok: Number(form.stok),
            is_active: form.is_active,
        };

        const options = {
            preserveScroll: true,
            only: ['produk'],
            onSuccess: () => {
                resetForm();
            },
            onError: (errs: Record<string, string>) => {
                setError(errs.nama || errs.sku || 'Gagal menyimpan varian.');
            },
        };

        if (editing) {
            router.put(`/produk/${product.id}/variants/${editing.id}`, payload, options);
        } else {
            router.post(`/produk/${product.id}/variants`, payload, options);
        }
    };

    const destroy = (variant: Variant) => {
        if (!product.id) return;
        if (confirm(`Hapus varian "${variant.nama}"?`)) {
            router.delete(`/produk/${product.id}/variants/${variant.id}`, {
                preserveScroll: true,
                only: ['produk'],
            });
        }
    };

    const inputClass =
        'w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
                aria-hidden="true"
            />
            <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-800">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            Kelola Varian
                        </h2>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {product.nama_produk}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                        aria-label="Tutup"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                    {(product.variants ?? []).length === 0 ? (
                        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                            Belum ada varian. Tambahkan varian pertama untuk produk ini.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {(product.variants ?? []).map((variant) => (
                                <div
                                    key={variant.id}
                                    className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {variant.nama}
                                            {!variant.is_active && (
                                                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                                    Nonaktif
                                                </span>
                                            )}
                                        </p>
                                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                            {variant.sku ? `SKU: ${variant.sku} · ` : ''}
                                            {variant.harga !== null
                                                ? `Harga: ${Number(variant.harga).toLocaleString('id-ID')}`
                                                : 'Harga: mengikuti produk'}{' '}
                                            · Stok: <span className="font-semibold">{variant.stok}</span>
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openEdit(variant)}
                                        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                                        title="Edit"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => destroy(variant)}
                                        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                                        title="Hapus"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={submit} className="border-t border-gray-200 pt-4 dark:border-gray-700">
                        {error && (
                            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                                {error}
                            </div>
                        )}
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                {editing ? `Edit Varian: ${editing.nama}` : 'Tambah Varian'}
                            </h3>
                            {editing && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    Batal edit
                                </button>
                            )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Nama Varian *
                                </label>
                                <input
                                    type="text"
                                    value={form.nama}
                                    onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))}
                                    placeholder="Contoh: Merah / Ukuran L"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                    SKU
                                </label>
                                <input
                                    type="text"
                                    value={form.sku}
                                    onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                                    placeholder="Opsional"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Harga (Rp)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.harga}
                                    onChange={(e) => setForm((p) => ({ ...p, harga: e.target.value }))}
                                    placeholder="Kosongkan: ikut harga produk"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Stok *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.stok}
                                    onChange={(e) => setForm((p) => ({ ...p, stok: e.target.value }))}
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex items-end pb-1">
                                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    Aktif
                                </label>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                        >
                            <PlusIcon className="h-4 w-4" />
                            {editing ? 'Simpan Varian' : 'Tambah Varian'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
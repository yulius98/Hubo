import {
    EllipsisVerticalIcon,
    PencilSquareIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Head, router } from '@inertiajs/react';
import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
    memo,
} from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Kategori {
    id: number;
    gambar: string;
    kategori: string;
}

interface Produk {
    id: number | null;
    nama_produk: string;
    harga_beli: number;
    margin: number;
    harga: number;
    ppn: number;
    tax: string;
    gambar: string;
    kategori?: { id: number; kategori: string };
    id_kategori?: number;
    keterangan?: string;
    diskon?: string;
    harga_diskon?: number;
}

interface PaginatedProduk {
    data: Produk[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Outlet {
    id: number;
    nama_outlet: string;
    alamat_outlet: string;
    kota: string;
    telp: string;
}

interface ProdukUserPageProps {
    outlet: Outlet;
    produk: PaginatedProduk;
    kategori: Kategori[];
    jmlProduk: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Produk',
        href: '/produk',
    },
];

interface NumericFormData {
    harga_beli: string;
    margin: string;
    ppn: string;
    tax: string;
}

const parseNumericValue = (value: string): number =>
    Number(value.replaceAll('.', '').replace(',', '.'));

const formatNumericValue = (num: number): string =>
    new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(num);

const calculateSellingPrice = (formData: NumericFormData): string => {
    if (!formData.harga_beli.trim() || !formData.margin.trim()) {
        return '';
    }

    const buyPrice = parseNumericValue(formData.harga_beli);
    const marginPct = parseNumericValue(formData.margin);

    if (Number.isNaN(buyPrice) || Number.isNaN(marginPct)) {
        return '';
    }

    let harga = buyPrice * (1 + marginPct / 100);

    if (formData.tax === 'include tax') {
        const ppn = parseNumericValue(formData.ppn);
        if (!Number.isNaN(ppn) && ppn > 0) {
            harga = harga * (1 + ppn / 100);
        }
    }

    return formatNumericValue(harga);
};

interface ProdukTableRowProps {
    item: Produk;
    index: number;
    page: number;
    limit: number;
    formatRupiah: (value: number) => string;
    onEdit: (item: Produk) => void;
    onDelete: (id: number) => void;
}

const ProdukTableRow = memo(function ProdukTableRow({
    item,
    index,
    page,
    limit,
    formatRupiah,
    onEdit,
    onDelete,
}: Readonly<ProdukTableRowProps>) {
    const nomor = (page - 1) * limit + index + 1;
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);
    const closeMenu = useCallback(() => setMenuOpen(false), []);
    const handleEditClick = useCallback(() => onEdit(item), [item, onEdit]);
    const handleDeleteClick = useCallback(
        () => onDelete(item.id!),
        [item.id, onDelete],
    );

    return (
        <tr className="bg-white transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/40">
            <td className="px-4 py-3.5 text-sm text-gray-500 tabular-nums dark:text-gray-400">
                {nomor}
            </td>
            <td className="px-4 py-3.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                {item.kategori?.kategori}
            </td>
            <td className="px-4 py-3.5">
                {item.gambar ? (
                    <img
                        src={`/${item.gambar}`}
                        alt={item.nama_produk}
                        className="h-12 w-12 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                    />
                ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/40">
                        <span className="text-[10px] text-gray-400">
                            No Image
                        </span>
                    </div>
                )}
            </td>
            <td className="px-4 py-3.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                <span
                    className="block max-w-[16rem] truncate"
                    title={item.nama_produk}
                >
                    {item.nama_produk}
                </span>
            </td>
            <td className="px-4 py-3.5 text-right text-sm font-semibold whitespace-nowrap text-gray-900 tabular-nums dark:text-gray-100">
                {formatRupiah(item.harga)}
            </td>
            <td className="px-4 py-3.5 text-right text-sm whitespace-nowrap text-gray-600 tabular-nums dark:text-gray-400">
                {formatRupiah(item.harga_beli ?? 0)}
            </td>
            <td className="px-4 py-3.5 text-right text-sm whitespace-nowrap text-gray-600 tabular-nums dark:text-gray-400">
                {Number(item.margin ?? 0).toLocaleString('id-ID')}%
            </td>
            <td className="px-4 py-3.5 text-right text-sm whitespace-nowrap text-gray-600 tabular-nums dark:text-gray-400">
                {Number(item.ppn ?? 0).toLocaleString('id-ID')}%
            </td>
            <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                {item.tax || '-'}
            </td>
            <td className="px-4 py-3.5 text-center">
                {item.diskon === 'yes' ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        Ya
                    </span>
                ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        Tidak
                    </span>
                )}
            </td>
            <td className="px-4 py-3.5 text-right text-sm font-medium whitespace-nowrap text-gray-900 tabular-nums dark:text-gray-100">
                {formatRupiah(item.harga_diskon ?? 0)}
            </td>
            <td className="px-4 py-3.5 text-right">
                <div ref={menuRef} className="relative inline-block">
                    <button
                        type="button"
                        onClick={toggleMenu}
                        aria-label="Aksi produk"
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <EllipsisVerticalIcon className="h-5 w-5" />
                    </button>

                    {menuOpen && (
                        <div className="absolute top-full right-0 z-10 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                            <button
                                type="button"
                                onClick={() => {
                                    closeMenu();
                                    handleEditClick();
                                }}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <PencilSquareIcon className="h-4 w-4 text-gray-400" />
                                Edit Produk
                            </button>
                            <div className="h-px bg-gray-100 dark:bg-gray-700" />
                            <button
                                type="button"
                                onClick={() => {
                                    closeMenu();
                                    handleDeleteClick();
                                }}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                            >
                                <TrashIcon className="h-4 w-4" />
                                Hapus Produk
                            </button>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
});

interface ProdukCardMobileProps {
    item: Produk;
    formatRupiah: (value: number) => string;
    onEdit: (item: Produk) => void;
    onDelete: (id: number) => void;
}

const ProdukCardMobile = memo(function ProdukCardMobile({
    item,
    formatRupiah,
    onEdit,
    onDelete,
}: Readonly<ProdukCardMobileProps>) {
    const handleEditClick = useCallback(() => onEdit(item), [item, onEdit]);
    const handleDeleteClick = useCallback(
        () => onDelete(item.id!),
        [item.id, onDelete],
    );

    return (
        <div className="space-y-4 px-5 py-6 hover:bg-gray-50 dark:hover:bg-gray-700/40">
            <div className="flex items-start gap-4">
                {item.gambar ? (
                    <img
                        src={`/${item.gambar}`}
                        alt={item.nama_produk}
                        className="h-16 w-16 rounded-lg object-cover sm:h-20 sm:w-20"
                    />
                ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-200 text-xs text-gray-500 sm:h-20 sm:w-20 dark:bg-gray-700 dark:text-gray-400">
                        No Image
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                        {item.kategori?.kategori}
                    </p>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {item.nama_produk}
                    </h3>
                    <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                        {item.diskon === 'yes' ? (
                            <>
                                <span className="mr-2 text-red-500 line-through">
                                    {formatRupiah(item.harga)}
                                </span>
                                <span>
                                    {formatRupiah(item.harga_diskon ?? 0)}
                                </span>
                            </>
                        ) : (
                            <span>{formatRupiah(item.harga)}</span>
                        )}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        PPN: {Number(item.ppn ?? 0).toLocaleString('id-ID')}% ·{' '}
                        {item.tax || '-'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleEditClick}
                        className="flex-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 sm:text-sm dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                    >
                        <PencilSquareIcon className="inline h-4 w-4" /> Edit
                    </button>
                    <button
                        type="button"
                        onClick={handleDeleteClick}
                        className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 sm:text-sm dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                    >
                        <TrashIcon className="inline h-4 w-4" /> Hapus
                    </button>
                </div>
            </div>
        </div>
    );
});

export default function Produk_User_Page({
    outlet,
    produk: produkPaginated,
    kategori,
    jmlProduk,
}: Readonly<ProdukUserPageProps>) {
    const [error, setError] = useState('');
    const [editId, setEditId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [preview, setPreview] = useState<string | null>(null);
    const kategoris = kategori ?? [];
    const fetchProdukRef = useRef<(() => void) | null>(null);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(jmlProduk / limit)),
        [jmlProduk, limit],
    );

    const produk = useMemo(
        () =>
            Array.isArray(produkPaginated)
                ? produkPaginated
                : produkPaginated?.data || [],
        [produkPaginated],
    );

    const formatRupiah = useCallback(
        (value: number) =>
            new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
            }).format(value),
        [],
    );

    const [formData, setFormData] = useState<{
        id: number | null;
        id_outlet: number | null;
        id_kategori: number | null;
        kategori: string;
        gambar: File | null;
        nama_produk: string;
        keterangan: string;
        harga_beli: string;
        harga: string;
        margin: string;
        ppn: string;
        tax: string;
        diskon: string;
        harga_diskon: string;
    }>({
        id: null,
        id_outlet: null,
        id_kategori: null,
        kategori: '',
        gambar: null,
        nama_produk: '',
        keterangan: '',
        harga_beli: '',
        harga: '',
        margin: '',
        ppn: '',
        tax: '',
        diskon: '',
        harga_diskon: '',
    });

    const handleNumericChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            const raw = value.replace(/[^0-9.,]/g, '');
            const num = parseNumericValue(raw);
            const formatted =
                raw === '' || Number.isNaN(num) ? '' : formatNumericValue(num);

            setFormData((prev) => {
                const next = { ...prev, [name]: formatted };
                return { ...next, harga: calculateSellingPrice(next) };
            });
        },
        [],
    );

    const handleMarginChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            const raw = value.replace(/[^0-9.,]/g, '');

            setFormData((prev) => {
                const next = { ...prev, [name]: raw };
                return { ...next, harga: calculateSellingPrice(next) };
            });
        },
        [],
    );

    const handlePricingChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            const { name, value } = e.target;

            setFormData((prev) => {
                const next = { ...prev, [name]: value };
                return { ...next, harga: calculateSellingPrice(next) };
            });
        },
        [],
    );

    const handleImageChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                setFormData((prev) => ({ ...prev, gambar: file }));
                setPreview(URL.createObjectURL(file));
            }
        },
        [],
    );

    const handleChange = useCallback(
        (
            e: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >,
        ) => {
            const { name, value } = e.target;
            if (name === 'kategori') {
                setFormData((prev) => ({
                    ...prev,
                    kategori: value,
                    id_kategori: value ? Number(value) : null,
                }));
            } else {
                setFormData((prev) => ({ ...prev, [name]: value }));
            }
        },
        [],
    );

    const resetForm = useCallback(() => {
        setShowForm(false);
        setEditId(null);
        setFormData({
            id: null,
            id_outlet: null,
            id_kategori: null,
            kategori: '',
            gambar: null,
            nama_produk: '',
            keterangan: '',
            harga_beli: '',
            harga: '',
            margin: '',
            ppn: '',
            tax: '',
            diskon: '',
            harga_diskon: '',
        });
        setPreview(null);
        setError('');
    }, []);

    const toggleForm = useCallback(() => {
        setShowForm((prev) => !prev);
        if (showForm) {
            resetForm();
        }
    }, [showForm, resetForm]);

    const validateMandatoryFields = useCallback((): boolean => {
        const missing: string[] = [];

        if (!formData.id_kategori) missing.push('Kategori');
        if (!formData.nama_produk.trim()) missing.push('Nama Produk');
        if (!formData.harga_beli) missing.push('Harga Beli');
        if (!formData.margin) missing.push('Margin');
        if (!formData.ppn) missing.push('PPN');
        if (!formData.tax) missing.push('Tax');
        if (!formData.diskon) missing.push('Diskon');

        if (missing.length > 0) {
            setError(`Field wajib belum diisi: ${missing.join(', ')}.`);
            return false;
        }

        setError('');
        return true;
    }, [formData]);

    const handleCreate = useCallback(
        (e: React.SubmitEvent) => {
            e.preventDefault();
            if (!validateMandatoryFields()) return;

            const dataToSend = {
                id: formData.id,
                id_outlet: outlet.id,
                id_kategori: formData.id_kategori,
                gambar: formData.gambar,
                nama_produk: formData.nama_produk,
                keterangan: formData.keterangan,
                harga_beli: parseNumericValue(formData.harga_beli),
                harga: parseNumericValue(formData.harga),
                margin: parseNumericValue(formData.margin),
                ppn: parseNumericValue(formData.ppn),
                tax: formData.tax,
                diskon: formData.diskon,
                harga_diskon: formData.harga_diskon
                    ? parseNumericValue(formData.harga_diskon)
                    : null,
            };

            router.post('/produk', dataToSend, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    resetForm();
                },
                onError: (errors) => {
                    setError(
                        errors.nama_produk ??
                            Object.values(errors)[0] ??
                            'Terjadi kesalahan saat menyimpan produk.',
                    );
                },
            });

            if (fetchProdukRef.current) fetchProdukRef.current();
        },
        [formData, outlet, resetForm, validateMandatoryFields],
    );

    const handleUpdate = useCallback(
        (e: React.SubmitEvent) => {
            e.preventDefault();
            if (!validateMandatoryFields()) return;

            const dataToSend = {
                id: formData.id,
                id_outlet: outlet.id,
                id_kategori: formData.id_kategori,
                gambar: formData.gambar,
                nama_produk: formData.nama_produk,
                keterangan: formData.keterangan,
                harga_beli: parseNumericValue(formData.harga_beli),
                harga: parseNumericValue(formData.harga),
                margin: parseNumericValue(formData.margin),
                ppn: parseNumericValue(formData.ppn),
                tax: formData.tax,
                diskon: formData.diskon,
                harga_diskon: formData.harga_diskon
                    ? parseNumericValue(formData.harga_diskon)
                    : null,
            };

            router.put(`/produk/${formData.id}`, dataToSend, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    resetForm();
                },
                onError: (errors) => {
                    setError(
                        errors.nama_produk ??
                            Object.values(errors)[0] ??
                            'Terjadi kesalahan saat menyimpan produk.',
                    );
                },
            });

            if (fetchProdukRef.current) fetchProdukRef.current();
        },
        [formData, outlet, resetForm, validateMandatoryFields],
    );

    const handleEdit = useCallback(
        (item: Produk) => {
            setEditId(item.id);
            setFormData({
                id: item.id,
                id_outlet: outlet.id,
                id_kategori: item.id_kategori ?? null,
                kategori: item.id_kategori?.toString() || '',
                gambar: null,
                nama_produk: item.nama_produk,
                keterangan: item.keterangan || '',
                harga_beli: formatNumericValue(item.harga_beli ?? 0),
                harga: formatNumericValue(item.harga ?? 0),
                margin: item.margin?.toString() || '',
                ppn: item.ppn?.toString() || '',
                tax: item.tax || '',
                diskon: item.diskon || '',
                harga_diskon: item.harga_diskon
                    ? formatNumericValue(item.harga_diskon)
                    : '',
            });
            if (item.gambar) {
                setPreview(`/${item.gambar}`);
            }
            setShowForm(true);
        },
        [outlet],
    );

    const handleDelete = useCallback(
        (id: number) => {
            if (!globalThis.confirm('Yakin hapus data ini?')) return;
            router.delete(`/produk/${id}`, {
                preserveScroll: true,
                preserveState: true,
            });
            resetForm();
            if (fetchProdukRef.current) fetchProdukRef.current();
        },
        [resetForm],
    );

    const handlePrevPage = useCallback(() => {
        setPage((p) => Math.max(1, p - 1));
    }, []);

    const handleNextPage = useCallback(() => {
        setPage((p) => (p < totalPages ? p + 1 : p));
    }, [totalPages]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produk" />
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
                        Kelola Produk {outlet.nama_outlet}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Tambah, edit, atau hapus produk.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            {editId ? 'Edit Produk' : 'Tambah Produk'}
                        </h2>
                        <button
                            type="button"
                            onClick={toggleForm}
                            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-900"
                        >
                            {showForm ? (
                                <>
                                    <XMarkIcon className="h-5 w-5" />
                                    Tutup Form
                                </>
                            ) : (
                                <>
                                    <PlusIcon className="h-5 w-5" />
                                    Tambah Produk
                                </>
                            )}
                        </button>
                    </div>

                    {showForm && (
                        <form
                            onSubmit={editId ? handleUpdate : handleCreate}
                            noValidate
                            className="divide-y divide-gray-200 dark:divide-gray-700"
                        >
                            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4 sm:p-6">
                                <div>
                                    <label
                                        htmlFor="kategori"
                                        className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Kategori{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="kategori"
                                        name="kategori"
                                        value={formData.kategori}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {kategoris.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.kategori}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="gambar"
                                        className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Gambar Produk
                                    </label>
                                    <input
                                        type="file"
                                        id="gambar"
                                        name="gambar"
                                        onChange={handleImageChange}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                    />
                                    {preview && (
                                        <div className="mt-2">
                                            <img
                                                src={preview}
                                                alt="Preview"
                                                className="h-32 w-32 rounded-lg object-cover"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="nama_produk"
                                        className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Nama Produk{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="nama_produk"
                                        name="nama_produk"
                                        value={formData.nama_produk}
                                        onChange={handleChange}
                                        placeholder="Contoh: Lenovo"
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="harga_beli"
                                        className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Harga Beli (Rp){' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="harga_beli"
                                        name="harga_beli"
                                        inputMode="decimal"
                                        value={formData.harga_beli}
                                        onChange={handleNumericChange}
                                        placeholder="0"
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="margin"
                                        className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Margin (%){' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="margin"
                                        name="margin"
                                        inputMode="decimal"
                                        value={formData.margin}
                                        onChange={handleMarginChange}
                                        placeholder="Contoh: 10"
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="ppn"
                                        className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        PPN{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="ppn"
                                        name="ppn"
                                        value={formData.ppn}
                                        onChange={handlePricingChange}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="">Pilih PPN</option>
                                        <option value="10">10%</option>
                                        <option value="11">11%</option>
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="tax"
                                        className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Tax{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="tax"
                                        name="tax"
                                        value={formData.tax}
                                        onChange={handlePricingChange}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="">
                                            Pilih Tipe Pajak
                                        </option>
                                        <option value="include tax">
                                            Include Tax
                                        </option>
                                        <option value="exclude tax">
                                            Exclude Tax
                                        </option>
                                        <option value="tanpa pajak">
                                            Tanpa Pajak
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="harga"
                                        className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Harga (Rp)
                                    </label>
                                    <input
                                        type="text"
                                        id="harga"
                                        name="harga"
                                        inputMode="decimal"
                                        value={formData.harga}
                                        readOnly
                                        placeholder="Hasil perhitungan otomatis"
                                        className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500 placeholder-gray-400 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-400"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="diskon"
                                        className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Diskon{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="diskon"
                                        name="diskon"
                                        value={formData.diskon}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="">Pilih Diskon</option>
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="harga_diskon"
                                        className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Harga Diskon (Rp)
                                    </label>
                                    <input
                                        type="text"
                                        id="harga_diskon"
                                        name="harga_diskon"
                                        inputMode="decimal"
                                        value={formData.harga_diskon}
                                        onChange={handleNumericChange}
                                        placeholder="0"
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    />
                                </div>
                            </div>

                            <div className="px-5 py-4 sm:px-6">
                                <label
                                    htmlFor="keterangan"
                                    className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Keterangan
                                </label>
                                <textarea
                                    id="keterangan"
                                    name="keterangan"
                                    value={formData.keterangan}
                                    onChange={handleChange}
                                    placeholder="Opsional"
                                    rows={2}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>

                            <div className="flex flex-col-reverse gap-3 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                                >
                                    {editId ? 'Simpan Perubahan' : 'Tambah'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            Daftar Produk di Outlet Saya
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Total:{' '}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {jmlProduk}
                            </span>{' '}
                            Produk
                        </span>
                    </div>

                    <div className="md:hidden">
                        {produk.length === 0 ? (
                            <div className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                Belum ada data produk.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {produk.map((item) => (
                                    <ProdukCardMobile
                                        key={item.id}
                                        item={item}
                                        formatRupiah={formatRupiah}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="hidden md:block">
                        <div className="overflow-x-scroll">
                            <table className="w-full" id="tabel_produk">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                                        <th className="w-14 px-4 py-3.5 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            No
                                        </th>
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Kategori
                                        </th>
                                        <th className="w-28 px-4 py-3.5 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Gambar Produk
                                        </th>
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Nama Produk
                                        </th>
                                        <th className="px-4 py-3.5 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Harga
                                        </th>
                                        <th className="px-4 py-3.5 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Harga Beli
                                        </th>
                                        <th className="px-4 py-3.5 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Margin
                                        </th>
                                        <th className="px-4 py-3.5 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            PPN
                                        </th>
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Tax
                                        </th>
                                        <th className="px-4 py-3.5 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Diskon
                                        </th>
                                        <th className="px-4 py-3.5 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Harga Diskon
                                        </th>
                                        <th className="w-20 px-4 py-3.5 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {produk.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={12}
                                                className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                                            >
                                                Belum ada data produk.
                                            </td>
                                        </tr>
                                    ) : (
                                        produk.map((item, index) => (
                                            <ProdukTableRow
                                                key={item.id}
                                                item={item}
                                                index={index}
                                                page={page}
                                                limit={limit}
                                                formatRupiah={formatRupiah}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handlePrevPage}
                                disabled={page === 1}
                                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                                Sebelumnya
                            </button>
                            <span className="px-2 text-sm text-gray-600 dark:text-gray-400">
                                Halaman {page} dari {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={handleNextPage}
                                disabled={page >= totalPages}
                                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}

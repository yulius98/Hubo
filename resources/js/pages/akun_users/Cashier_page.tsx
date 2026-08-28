import { router } from '@inertiajs/react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TopBarKasir from '@/components/TopBarKasir';

interface Variant {
    id: number;
    nama: string;
    sku: string | null;
    harga: number | null;
    stok: number;
    is_active: boolean;
}

interface Produks {
    id: number;
    id_outlet: number;
    id_kategori: number;
    gambar: string;
    nama_produk: string;
    keterangan: string;
    harga: number;
    diskon: string;
    harga_diskon: number;
    stok: number;
    effective_stok?: number;
    variants?: Variant[];
    jumlah?: number;
}

interface Outlet {
    id: number;
    nama_outlet: string;
}

interface BelanjaItem {
    id: number;
    produk: string;
    price: number;
    quantity: number;
    customer?: {
        id: number;
        name: string;
        points: number;
    } | null;
}

interface Customer {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    points: number;
}

interface StrukData {
    items: {
        produk: string;
        qty: number;
        price: number;
        subtotal: number;
    }[];
    total: number;
    metode: string;
    tunai: number | null;
    kembalian: number | null;
    date: Date;
    kasir: string;
}

interface CashierPageProps {
    outlet: Outlet;
    produks: Produks[];
    keranjang: BelanjaItem[];
    customers: Customer[];
}

export default function CashierPage({
    outlet,
    produks,
    keranjang,
    customers,
}: Readonly<CashierPageProps>) {
    const [error, setError] = useState<string>('');
    const [stok, setStok] = useState<Produks[]>(() =>
        produks.map((p) => ({ ...p, jumlah: undefined })),
    );
    const [stokBelanja, setStokBelanja] = useState<BelanjaItem[]>(keranjang);
    const [selectedVariant, setSelectedVariant] = useState<
        Record<number, number>
    >({});
    const [selectedCustomer, setSelectedCustomer] = useState<number | ''>('');
    const [totalStok, setTotalStok] = useState<number>(produks.length);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(5);

    const paginatedStok = useMemo(() => {
        const start = (page - 1) * limit;
        return stok.slice(start, start + limit);
    }, [stok, page, limit]);
    const [metodepembayaran, setMetodePembayaran] = useState('');
    const [jumlahTunai, setJumlahTunai] = useState<string>('');
    const [strukData, setStrukData] = useState<StrukData | null>(null);
    const [prevOutletId, setPrevOutletId] = useState(outlet.id);
    const [prevKeranjang, setPrevKeranjang] = useState(keranjang);

    const totalPrice = useMemo(
        () =>
            stokBelanja.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0,
            ),
        [stokBelanja],
    );

    const jumlahTunaiNum = useMemo(
        () => Number(jumlahTunai) || 0,
        [jumlahTunai],
    );
    const kembalian = useMemo(
        () => Math.max(0, jumlahTunaiNum - totalPrice),
        [jumlahTunaiNum, totalPrice],
    );
    const isTunaiInvalid = useMemo(
        () => metodepembayaran === 'tunai' && jumlahTunaiNum < totalPrice,
        [metodepembayaran, jumlahTunaiNum, totalPrice],
    );

    const formattedJumlahTunai = useMemo(
        () =>
            jumlahTunaiNum
                ? new Intl.NumberFormat('id-ID').format(jumlahTunaiNum)
                : '',
        [jumlahTunaiNum],
    );

    const formattedKembalian = useMemo(
        () =>
            new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
            }).format(kembalian),
        [kembalian],
    );

    const formatRupiah = useCallback((value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    }, []);

    const selectedVariantOf = useCallback(
        (item: Produks) => {
            const vid = selectedVariant[item.id];
            return item.variants?.find((v) => v.id === vid);
        },
        [selectedVariant],
    );

    const displayPriceOf = useCallback(
        (item: Produks) => {
            const variant = selectedVariantOf(item);
            return variant?.harga ?? item.harga_diskon ?? item.harga;
        },
        [selectedVariantOf],
    );

    const effectiveStockOf = useCallback(
        (item: Produks) => item.effective_stok ?? item.stok,
        [],
    );

    const handleVariantChange = useCallback(
        (id_produk: number, variantId: number) => {
            setSelectedVariant((prev) => ({
                ...prev,
                [id_produk]: variantId,
            }));
        },
        [],
    );

    const handleJumlahChange = useCallback((id: number, value: string) => {
        if (value === '') {
            setStok((prev) =>
                prev.map((item) =>
                    item.id === id ? { ...item, jumlah: undefined } : item,
                ),
            );
            return;
        }

        const jumlah = Number(value);
        if (Number.isNaN(jumlah) || jumlah < 0) return;

        setStok((prev) =>
            prev.map((item) => (item.id === id ? { ...item, jumlah } : item)),
        );
    }, []);

    const handleAdd = useCallback(
        (
            id_kategori: number,
            id_produk: number,
            jumlah?: number,
            variantId?: number,
        ) => {
            if (!jumlah || jumlah < 1) {
                alert('Masukkan jumlah yang valid');
                return;
            }

            router.post(
                '/cashier/cart',
                {
                    id_produk,
                    id_kategori,
                    jumlah_produk: jumlah,
                    ...(variantId ? { variant_id: variantId } : {}),
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        setStok((prev) =>
                            prev.map((item) =>
                                item.id === id_produk
                                    ? { ...item, jumlah: undefined }
                                    : item,
                            ),
                        );
                    },
                    onError: () => setError('Gagal menambahkan ke keranjang'),
                },
            );
        },
        [],
    );

    const handleHapus = useCallback((id: number) => {
        if (!globalThis.window.confirm('Yakin ingin menghapus item ini?'))
            return;

        router.delete(`/cashier/cart/${id}`, {
            preserveScroll: true,
            preserveState: true,
            onError: () => setError('Gagal menghapus item'),
        });
    }, []);

    const handleMetodePembayaranChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            const metode = e.target.value;
            setMetodePembayaran(metode);
            if (metode !== 'tunai') {
                setJumlahTunai('');
            }
        },
        [],
    );

    const handleJumlahTunaiChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value.replaceAll(/\D/g, '');
            setJumlahTunai(raw);
        },
        [],
    );

    const handleBayar = useCallback(() => {
        const user = localStorage.getItem('user_name') || 'Kasir';

        const struk: StrukData = {
            items: stokBelanja.map((i) => ({
                produk: i.produk,
                qty: i.quantity,
                price: i.price,
                subtotal: i.price * i.quantity,
            })),
            total: totalPrice,
            metode: metodepembayaran,
            tunai: metodepembayaran === 'tunai' ? jumlahTunaiNum : null,
            kembalian: metodepembayaran === 'tunai' ? kembalian : null,
            date: new Date(),
            kasir: user,
        };

        try {
            setStrukData(struk);
            setMetodePembayaran('');
            setJumlahTunai('');
            setError('');

            router.post(
                '/cashier/cart/finalize',
                {
                    customer_id: selectedCustomer === '' ? null : selectedCustomer,
                    payment_method: metodepembayaran,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => setStokBelanja([]),
                    onError: () => setError('Gagal memproses pembayaran'),
                },
            );
        } catch {
            setError('Gagal memproses pembayaran');
        }
    }, [stokBelanja, totalPrice, metodepembayaran, jumlahTunaiNum, kembalian, selectedCustomer]);

    if (prevOutletId !== outlet.id) {
        setPrevOutletId(outlet.id);
        setStok(produks.map((p) => ({ ...p, jumlah: undefined })));
        setTotalStok(produks.length);
        setPage(1);
        setStokBelanja(keranjang);
        setSelectedVariant({});
        setSelectedCustomer('');
        setMetodePembayaran('');
        setJumlahTunai('');
        setError('');
    }

    if (prevKeranjang !== keranjang) {
        setPrevKeranjang(keranjang);
        setStokBelanja(keranjang);
    }

    useEffect(() => {
        if (!strukData) return;

        const handleAfterPrint = () => {
            setStrukData(null);
            globalThis.window.removeEventListener(
                'afterprint',
                handleAfterPrint,
            );
        };

        globalThis.window.addEventListener('afterprint', handleAfterPrint);
        const timer = setTimeout(() => globalThis.window.print(), 300);

        return () => {
            clearTimeout(timer);
            globalThis.window.removeEventListener(
                'afterprint',
                handleAfterPrint,
            );
        };
    }, [strukData]);

    return (
        <>
            {strukData && (
                <div className="mx-auto hidden max-w-[80mm] bg-white p-6 font-mono text-sm text-black print:block">
                    <div className="mb-3 border-b border-black pb-2 text-center">
                        <p className="text-base font-bold">STRUK BELANJA</p>
                        <p>{strukData.date.toLocaleString('id-ID')}</p>
                        <p>Kasir: {strukData.kasir}</p>
                    </div>

                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-black">
                                <th className="py-1 text-left">Barang</th>
                                <th className="w-12 py-1 text-center">Qty</th>
                                <th className="py-1 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {strukData.items.map((row, idx) => (
                                <tr
                                    key={idx}
                                    className="border-b border-gray-300"
                                >
                                    <td className="py-1">{row.produk}</td>
                                    <td className="py-1 text-center">
                                        {row.qty}
                                    </td>
                                    <td className="py-1 text-right">
                                        {new Intl.NumberFormat('id-ID', {
                                            style: 'currency',
                                            currency: 'IDR',
                                            minimumFractionDigits: 0,
                                        }).format(row.subtotal)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-4 space-y-1 border-t-2 border-black pt-2">
                        <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span>
                                {new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0,
                                }).format(strukData.total)}
                            </span>
                        </div>

                        {strukData.metode === 'tunai' && (
                            <>
                                <div className="flex justify-between">
                                    <span>Tunai</span>
                                    <span>
                                        {new Intl.NumberFormat('id-ID', {
                                            style: 'currency',
                                            currency: 'IDR',
                                            minimumFractionDigits: 0,
                                        }).format(strukData.tunai ?? 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Kembalian</span>
                                    <span>
                                        {new Intl.NumberFormat('id-ID', {
                                            style: 'currency',
                                            currency: 'IDR',
                                            minimumFractionDigits: 0,
                                        }).format(strukData.kembalian ?? 0)}
                                    </span>
                                </div>
                            </>
                        )}

                        {strukData.metode === 'nontunai' && (
                            <div className="flex justify-between">
                                <span>Metode</span>
                                <span>Non-Tunai</span>
                            </div>
                        )}
                    </div>

                    <p className="mt-5 text-center text-xs">
                        Terima kasih telah berbelanja!
                    </p>
                </div>
            )}

            <div className="min-h-screen bg-slate-50 pt-16 print:hidden">
                <TopBarKasir namaOutlet={outlet.nama_outlet} />

                <div className="mx-auto max-w-[1600px] p-4 md:p-6">
                    <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="w-full min-w-[220px] rounded-xl bg-emerald-800 px-6 py-4 text-right text-white sm:w-auto">
                            <p className="text-sm tracking-wide text-emerald-200 uppercase">
                                Total Belanja
                            </p>
                            <p className="text-2xl font-bold">
                                {formatRupiah(totalPrice)}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                        <div className="flex flex-col lg:col-span-3">
                            <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow">
                                <div className="border-b bg-slate-50 px-6 py-4">
                                    <h2 className="text-lg font-semibold">
                                        Daftar Produk
                                    </h2>
                                </div>

                                <div className="flex-1 overflow-auto p-4">
                                    <div className="overflow-x-auto rounded-lg border">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-700 text-white">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">
                                                        No
                                                    </th>
                                                    <th className="px-4 py-3 text-left">
                                                        Nama Produk
                                                    </th>
                                                    <th className="px-4 py-3 text-left">
                                                        Varian
                                                    </th>
                                                    <th className="px-4 py-3 text-center">
                                                        Stok
                                                    </th>
                                                    <th className="px-4 py-3 text-right">
                                                        Harga
                                                    </th>
                                                    <th className="px-4 py-3 text-center">
                                                        Jumlah
                                                    </th>
                                                    <th className="px-4 py-3 text-center">
                                                        Aksi
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {paginatedStok.map(
                                                    (item, index) => (
                                                        <tr
                                                            key={item.id}
                                                            className="text-black hover:bg-slate-50"
                                                        >
                                                            <td className="px-4 py-3">
                                                                {(page - 1) *
                                                                    limit +
                                                                    index +
                                                                    1}
                                                            </td>
                                                            <td className="px-4 py-3 font-medium">
                                                                {item.nama_produk}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {item.variants?.length
                                                                    ? (
                                                                        <select
                                                                            value={
                                                                                selectedVariant[
                                                                                    item.id
                                                                                ] ?? ''
                                                                            }
                                                                            onChange={(e) =>
                                                                                handleVariantChange(
                                                                                    item.id,
                                                                                    Number(
                                                                                        e.target
                                                                                            .value,
                                                                                    ),
                                                                                )
                                                                            }
                                                                            className="w-full max-w-[140px] rounded border px-2 py-1 text-sm focus:ring-emerald-500"
                                                                        >
                                                                            <option
                                                                                value=""
                                                                                disabled
                                                                            >
                                                                                Pilih varian
                                                                            </option>
                                                                            {item.variants.map(
                                                                                (v) => (
                                                                                    <option
                                                                                        key={
                                                                                            v.id
                                                                                        }
                                                                                        value={
                                                                                            v.id
                                                                                        }
                                                                                    >
                                                                                        {v.nama}
                                                                                    </option>
                                                                                ),
                                                                            )}
                                                                        </select>
                                                                    ) : (
                                                                        <span className="text-xs text-slate-400">
                                                                            -
                                                                        </span>
                                                                    )}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {effectiveStockOf(
                                                                    item,
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                {formatRupiah(
                                                                    displayPriceOf(
                                                                        item,
                                                                    ),
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    max={
                                                                        effectiveStockOf(
                                                                            item,
                                                                        )
                                                                    }
                                                                    value={
                                                                        item.jumlah ??
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleJumlahChange(
                                                                            item.id,
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className="mx-auto block w-20 rounded border py-1 text-center focus:ring-emerald-500"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <button
                                                                    onClick={() =>
                                                                        handleAdd(
                                                                            item.id_kategori,
                                                                            item.id,
                                                                            item.jumlah,
                                                                            item
                                                                                .variants
                                                                                ?.length
                                                                                ? selectedVariant[
                                                                                      item
                                                                                          .id
                                                                                  ] ??
                                                                                      undefined
                                                                                : undefined,
                                                                        )
                                                                    }
                                                                    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-white hover:bg-emerald-700 disabled:opacity-50"
                                                                    disabled={
                                                                        !item.jumlah ||
                                                                        item.jumlah <
                                                                            1 ||
                                                                        Boolean(
                                                                            item
                                                                                .variants
                                                                                ?.length &&
                                                                                !selectedVariant[
                                                                                    item
                                                                                        .id
                                                                                ],
                                                                        )
                                                                    }
                                                                >
                                                                    Tambah
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {error && (
                                        <p className="mt-4 text-red-600">
                                            {error}
                                        </p>
                                    )}

                                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() =>
                                                    setPage((p) =>
                                                        Math.max(1, p - 1),
                                                    )
                                                }
                                                disabled={page === 1}
                                                className="rounded border px-4 py-2 disabled:opacity-50"
                                            >
                                                Sebelumnya
                                            </button>
                                            <span>
                                                Hal {page} /{' '}
                                                {Math.ceil(totalStok / limit) ||
                                                    1}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    setPage((p) => p + 1)
                                                }
                                                disabled={
                                                    page * limit >= totalStok
                                                }
                                                className="rounded border px-4 py-2 disabled:opacity-50"
                                            >
                                                Selanjutnya
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <select
                                                value={limit}
                                                onChange={(e) => {
                                                    setLimit(
                                                        Number(e.target.value),
                                                    );
                                                    setPage(1);
                                                }}
                                                className="rounded border px-3 py-1.5"
                                            >
                                                <option value={5}>5</option>
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                            </select>
                                            <span className="text-slate-600">
                                                Total: {totalStok}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col lg:col-span-2">
                            <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow">
                                <div className="border-b bg-slate-50 px-6 py-4">
                                    <h2 className="text-lg font-semibold">
                                        Keranjang Belanja
                                    </h2>
                                </div>

                                <div className="flex flex-1 flex-col p-4">
                                    <div className="flex-1 overflow-auto rounded-lg border">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 bg-slate-700 text-white">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">
                                                        No
                                                    </th>
                                                    <th className="px-4 py-3 text-left">
                                                        Produk
                                                    </th>
                                                    <th className="px-4 py-3 text-center">
                                                        Qty
                                                    </th>
                                                    <th className="px-4 py-3 text-right">
                                                        Subtotal
                                                    </th>
                                                    <th className="px-4 py-3 text-center">
                                                        Aksi
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {stokBelanja.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={5}
                                                            className="py-8 text-center text-gray-500"
                                                        >
                                                            Keranjang belanja
                                                            kosong
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    stokBelanja.map(
                                                        (item, idx) => (
                                                            <tr
                                                                key={item.id}
                                                                className="text-black hover:bg-slate-50"
                                                            >
                                                                <td className="px-4 py-3">
                                                                    {idx + 1}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {
                                                                        item.produk
                                                                    }
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    {formatRupiah(
                                                                        item.price *
                                                                            item.quantity,
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <button
                                                                        onClick={() =>
                                                                            handleHapus(
                                                                                item.id,
                                                                            )
                                                                        }
                                                                        className="rounded bg-red-100 px-3 py-1 text-red-700 hover:bg-red-200"
                                                                    >
                                                                        Hapus
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {error && (
                                        <p className="mt-3 text-sm text-red-600">
                                            {error}
                                        </p>
                                    )}

                                    <div className="mt-6 space-y-5 border-t pt-6">
                                        <div>
                                            <label
                                                htmlFor="pelanggan"
                                                className="mb-1 block text-sm font-medium"
                                            >
                                                Pelanggan
                                            </label>
                                            <select
                                                value={selectedCustomer}
                                                onChange={(e) =>
                                                    setSelectedCustomer(
                                                        e.target.value === ''
                                                            ? ''
                                                            : Number(
                                                                  e.target
                                                                      .value,
                                                              ),
                                                    )
                                                }
                                                className="w-full rounded border px-3 py-2 focus:ring-emerald-500"
                                            >
                                                <option value="">
                                                    — Tanpa pelanggan (umum) —
                                                </option>
                                                {customers.map((c) => (
                                                    <option
                                                        key={c.id}
                                                        value={c.id}
                                                    >
                                                        {c.name}
                                                        {c.points
                                                            ? ` · ${c.points} poin`
                                                            : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total</span>
                                            <span>
                                                {formatRupiah(totalPrice)}
                                            </span>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="pembayaran"
                                                className="mb-1 block text-sm font-medium"
                                            >
                                                Metode Pembayaran
                                            </label>
                                            <select
                                                value={metodepembayaran}
                                                onChange={
                                                    handleMetodePembayaranChange
                                                }
                                                className="w-full rounded border px-3 py-2 focus:ring-emerald-500"
                                            >
                                                <option value="">
                                                    — Pilih metode —
                                                </option>
                                                <option value="tunai">
                                                    Tunai
                                                </option>
                                                <option value="nontunai">
                                                    Non-Tunai (QRIS / Kartu)
                                                </option>
                                            </select>
                                        </div>

                                        {metodepembayaran === 'tunai' && (
                                            <div className="space-y-4 rounded-lg border bg-slate-50 p-4">
                                                <div>
                                                    <label
                                                        htmlFor="jml_tunai"
                                                        className="mb-1 block text-sm font-medium"
                                                    >
                                                        Jumlah Tunai
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={
                                                            formattedJumlahTunai
                                                        }
                                                        onChange={
                                                            handleJumlahTunaiChange
                                                        }
                                                        className="w-full rounded border px-3 py-2 focus:ring-emerald-500"
                                                        placeholder="Masukkan nominal tunai"
                                                    />
                                                    {isTunaiInvalid && (
                                                        <p className="mt-1 text-xs text-red-600">
                                                            Jumlah tunai harus
                                                            sama atau lebih
                                                            besar dari total
                                                            belanja
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor="kembalian"
                                                        className="mb-1 block text-sm font-medium"
                                                    >
                                                        Kembalian
                                                    </label>
                                                    <div className="w-full rounded border bg-slate-100 px-3 py-2 text-slate-700">
                                                        {formattedKembalian}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleBayar}
                                            disabled={
                                                stokBelanja.length === 0 ||
                                                isTunaiInvalid ||
                                                !metodepembayaran
                                            }
                                            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Bayar Sekarang
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

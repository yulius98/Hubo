import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import TopBarKasir from "@/components/TopBarKasir";

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
}

export default function CashierPage({ outlet, produks }: Readonly<CashierPageProps>) {
    const [error, setError] = useState<string>("");
    const [stok, setStok] = useState<Produks[]>(() =>
        produks.map((p) => ({ ...p, jumlah: undefined }))
    );
    const [stokBelanja, setStokBelanja] = useState<BelanjaItem[]>([]);
    const [totalStok, setTotalStok] = useState<number>(produks.length);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(5);
    const [metodepembayaran, setMetodePembayaran] = useState("");
    const [jumlahTunai, setJumlahTunai] = useState<string>("");
    const [strukData, setStrukData] = useState<StrukData | null>(null);

    const fetchStokRef = useRef<() => void>(() => {});
    const fetchBelanjaRef = useRef<() => void>(() => {});

    const formattedDate = useMemo(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    const totalPrice = useMemo(
        () => stokBelanja.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [stokBelanja]
    );

    const jumlahTunaiNum = useMemo(() => Number(jumlahTunai) || 0, [jumlahTunai]);
    const kembalian = useMemo(() => Math.max(0, jumlahTunaiNum - totalPrice), [jumlahTunaiNum, totalPrice]);
    const isTunaiInvalid = useMemo(
        () => metodepembayaran === "tunai" && jumlahTunaiNum < totalPrice,
        [metodepembayaran, jumlahTunaiNum, totalPrice]
    );

    const formattedJumlahTunai = useMemo(
        () => (jumlahTunaiNum ? new Intl.NumberFormat("id-ID").format(jumlahTunaiNum) : ""),
        [jumlahTunaiNum]
    );

    const formattedKembalian = useMemo(
        () =>
            new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
            }).format(kembalian),
        [kembalian]
    );

    const formatRupiah = useCallback((value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value);
    }, []);

    const handleJumlahChange = useCallback((id: number, value: string) => {
        if (value === "") {
            setStok((prev) =>
                prev.map((item) =>
                    item.id === id ? { ...item, jumlah: undefined } : item
                )
            );
            return;
        }

        const jumlah = Number(value);
        if (Number.isNaN(jumlah) || jumlah < 0) return;

        setStok((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, jumlah } : item
            )
        );
    }, []);

    const handleAdd = useCallback(
        (id_kategori: number, id_produk: number, jumlah?: number) => {
            if (!jumlah || jumlah < 1) {
                alert("Masukkan jumlah yang valid");
                return;
            }

            try {
                const payload = {
                    tgl_trx: formattedDate,
                    id_produk,
                    id_kategori,
                    movement_type: "OUT",
                    status: "pending",
                    quantity: jumlah,
                    user_name: localStorage.getItem("user_name") || "unknown",
                };

                console.log("Data dikirim ke API:", payload);
                fetchStokRef.current();
                fetchBelanjaRef.current();
            } catch {
                setError("Gagal menambahkan ke keranjang");
            }
        },
        [formattedDate]
    );

    const handleHapus = useCallback((id: number) => {
        if (!globalThis.window.confirm("Yakin ingin menghapus item ini?")) return;
        try {
            fetchBelanjaRef.current();
            fetchStokRef.current();
        } catch {
            setError("Gagal menghapus item");
        }
    }, []);

    const handleMetodePembayaranChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            const metode = e.target.value;
            setMetodePembayaran(metode);
            if (metode !== "tunai") {
                setJumlahTunai("");
            }
        },
        []
    );

    const handleJumlahTunaiChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replaceAll(/\D/g, "");
        setJumlahTunai(raw);
    }, []);

    const handleBayar = useCallback(() => {
        const user = localStorage.getItem("user_name") || "Kasir";

        const struk: StrukData = {
            items: stokBelanja.map((i) => ({
                produk: i.produk,
                qty: i.quantity,
                price: i.price,
                subtotal: i.price * i.quantity,
            })),
            total: totalPrice,
            metode: metodepembayaran,
            tunai: metodepembayaran === "tunai" ? jumlahTunaiNum : null,
            kembalian: metodepembayaran === "tunai" ? kembalian : null,
            date: new Date(),
            kasir: user,
        };

        try {
            setStrukData(struk);
            setMetodePembayaran("");
            setJumlahTunai("");
            setError("");
            fetchStokRef.current();
            fetchBelanjaRef.current();
        } catch {
            setError("Gagal memproses pembayaran");
        }
    }, [stokBelanja, totalPrice, metodepembayaran, jumlahTunaiNum, kembalian]);

    useEffect(() => {
        let isMounted = true;

        const fetchStok = async () => {
            try {
                setTotalStok(produks.length);
            } catch {
                if (isMounted) setError("Gagal memuat daftar produk");
            }
        };

        fetchStokRef.current = fetchStok;
        fetchStok();

        return () => {
            isMounted = false;
        };
    }, [page, limit, produks]);

    useEffect(() => {
        let isMounted = true;

        const fetchBelanja = async () => {
            try {
                const username = localStorage.getItem("user_name") || "unknown";
            } catch {
                if (isMounted) setError("Gagal memuat keranjang belanja");
            }
        };

        fetchBelanjaRef.current = fetchBelanja;
        fetchBelanja();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!strukData) return;

        const handleAfterPrint = () => {
            setStrukData(null);
            globalThis.window.removeEventListener("afterprint", handleAfterPrint);
        };

        globalThis.window.addEventListener("afterprint", handleAfterPrint);
        const timer = setTimeout(() => globalThis.window.print(), 300);

        return () => {
            clearTimeout(timer);
            globalThis.window.removeEventListener("afterprint", handleAfterPrint);
        };
    }, [strukData]);

    return (
        <>
            {strukData && (
                <div className="hidden print:block p-6 max-w-[80mm] mx-auto bg-white text-black text-sm font-mono">
                    <div className="text-center border-b border-black pb-2 mb-3">
                        <p className="font-bold text-base">STRUK BELANJA</p>
                        <p>{strukData.date.toLocaleString("id-ID")}</p>
                        <p>Kasir: {strukData.kasir}</p>
                    </div>

                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-black">
                                <th className="text-left py-1">Barang</th>
                                <th className="text-center py-1 w-12">Qty</th>
                                <th className="text-right py-1">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {strukData.items.map((row, idx) => (
                                <tr key={idx} className="border-b border-gray-300">
                                    <td className="py-1">{row.produk}</td>
                                    <td className="text-center py-1">{row.qty}</td>
                                    <td className="text-right py-1">
                                        {new Intl.NumberFormat("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                            minimumFractionDigits: 0,
                                        }).format(row.subtotal)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-4 pt-2 border-t-2 border-black space-y-1">
                        <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span>
                                {new Intl.NumberFormat("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                    minimumFractionDigits: 0,
                                }).format(strukData.total)}
                            </span>
                        </div>

                        {strukData.metode === "tunai" && (
                            <>
                                <div className="flex justify-between">
                                    <span>Tunai</span>
                                    <span>
                                        {new Intl.NumberFormat("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                            minimumFractionDigits: 0,
                                        }).format(strukData.tunai ?? 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Kembalian</span>
                                    <span>
                                        {new Intl.NumberFormat("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                            minimumFractionDigits: 0,
                                        }).format(strukData.kembalian ?? 0)}
                                    </span>
                                </div>
                            </>
                        )}

                        {strukData.metode === "nontunai" && (
                            <div className="flex justify-between">
                                <span>Metode</span>
                                <span>Non-Tunai</span>
                            </div>
                        )}
                    </div>

                    <p className="text-center mt-5 text-xs">Terima kasih telah berbelanja!</p>
                </div>
            )}

            <div className="min-h-screen bg-slate-50 pt-16 print:hidden">
                <TopBarKasir namaOutlet={outlet.nama_outlet} />

                <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div className="bg-emerald-800 text-white rounded-xl px-6 py-4 text-right w-full sm:w-auto min-w-[220px]">
                            <p className="text-sm uppercase tracking-wide text-emerald-200">Total Belanja</p>
                            <p className="text-2xl font-bold">{formatRupiah(totalPrice)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-3 flex flex-col">
                            <div className="bg-white rounded-2xl shadow border overflow-hidden flex flex-col h-full">
                                <div className="px-6 py-4 border-b bg-slate-50">
                                    <h2 className="text-lg font-semibold">Daftar Produk</h2>
                                </div>

                                <div className="flex-1 overflow-auto p-4">
                                    <div className="overflow-x-auto rounded-lg border">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-700 text-white">
                                                <tr>
                                                    <th className="text-left py-3 px-4">No</th>
                                                    <th className="text-left py-3 px-4">Nama Produk</th>
                                                    <th className="text-center py-3 px-4">Stok</th>
                                                    <th className="text-right py-3 px-4">Harga</th>
                                                    <th className="text-center py-3 px-4">Jumlah</th>
                                                    <th className="text-center py-3 px-4">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {stok.map((item, index) => (
                                                    <tr key={item.id} className="hover:bg-slate-50">
                                                        <td className="py-3 px-4">{index + 1}</td>
                                                        <td className="py-3 px-4 font-medium">{item.nama_produk}</td>
                                                        <td className="py-3 px-4 text-center">{item.stok}</td>
                                                        <td className="py-3 px-4 text-right">{formatRupiah(item.harga)}</td>
                                                        <td className="py-3 px-4">
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                max={item.stok}
                                                                value={item.jumlah ?? ""}
                                                                onChange={(e) => handleJumlahChange(item.id, e.target.value)}
                                                                className="w-20 mx-auto block text-center border rounded py-1 focus:ring-emerald-500"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <button
                                                                onClick={() =>
                                                                    handleAdd(item.id_kategori, item.id, item.jumlah)
                                                                }
                                                                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                                                disabled={!item.jumlah || item.jumlah < 1}
                                                            >
                                                                Tambah
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {error && <p className="mt-4 text-red-600">{error}</p>}

                                    <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                                className="px-4 py-2 border rounded disabled:opacity-50"
                                            >
                                                Sebelumnya
                                            </button>
                                            <span>
                                                Hal {page} / {Math.ceil(totalStok / limit) || 1}
                                            </span>
                                            <button
                                                onClick={() => setPage((p) => p + 1)}
                                                disabled={page * limit >= totalStok}
                                                className="px-4 py-2 border rounded disabled:opacity-50"
                                            >
                                                Selanjutnya
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <select
                                                value={limit}
                                                onChange={(e) => {
                                                    setLimit(Number(e.target.value));
                                                    setPage(1);
                                                }}
                                                className="border rounded px-3 py-1.5"
                                            >
                                                <option value={5}>5</option>
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                            </select>
                                            <span className="text-slate-600">Total: {totalStok}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 flex flex-col">
                            <div className="bg-white rounded-2xl shadow border overflow-hidden flex flex-col h-full">
                                <div className="px-6 py-4 border-b bg-slate-50">
                                    <h2 className="text-lg font-semibold">Keranjang Belanja</h2>
                                </div>

                                <div className="flex-1 p-4 flex flex-col">
                                    <div className="flex-1 overflow-auto border rounded-lg">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-700 text-white sticky top-0">
                                                <tr>
                                                    <th className="text-left py-3 px-4">No</th>
                                                    <th className="text-left py-3 px-4">Produk</th>
                                                    <th className="text-center py-3 px-4">Qty</th>
                                                    <th className="text-right py-3 px-4">Subtotal</th>
                                                    <th className="text-center py-3 px-4">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {stokBelanja.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="py-8 text-center text-gray-500">
                                                            Keranjang belanja kosong
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    stokBelanja.map((item, idx) => (
                                                        <tr key={item.id} className="hover:bg-slate-50">
                                                            <td className="py-3 px-4">{idx + 1}</td>
                                                            <td className="py-3 px-4">{item.produk}</td>
                                                            <td className="py-3 px-4 text-center">{item.quantity}</td>
                                                            <td className="py-3 px-4 text-right">
                                                                {formatRupiah(item.price * item.quantity)}
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                <button
                                                                    onClick={() => handleHapus(item.id)}
                                                                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                                >
                                                                    Hapus
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}

                                    <div className="mt-6 pt-6 border-t space-y-5">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total</span>
                                            <span>{formatRupiah(totalPrice)}</span>
                                        </div>

                                        <div>
                                            <label htmlFor="pembayaran" className="block text-sm font-medium mb-1">
                                                Metode Pembayaran
                                            </label>
                                            <select
                                                value={metodepembayaran}
                                                onChange={handleMetodePembayaranChange}
                                                className="w-full border rounded px-3 py-2 focus:ring-emerald-500"
                                            >
                                                <option value="">— Pilih metode —</option>
                                                <option value="tunai">Tunai</option>
                                                <option value="nontunai">Non-Tunai (QRIS / Kartu)</option>
                                            </select>
                                        </div>

                                        {metodepembayaran === "tunai" && (
                                            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                                                <div>
                                                    <label htmlFor="jml_tunai" className="block text-sm font-medium mb-1">
                                                        Jumlah Tunai
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formattedJumlahTunai}
                                                        onChange={handleJumlahTunaiChange}
                                                        className="w-full border rounded px-3 py-2 focus:ring-emerald-500"
                                                        placeholder="Masukkan nominal tunai"
                                                    />
                                                    {isTunaiInvalid && (
                                                        <p className="mt-1 text-xs text-red-600">
                                                            Jumlah tunai harus sama atau lebih besar dari total belanja
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label htmlFor="kembalian" className="block text-sm font-medium mb-1">
                                                        Kembalian
                                                    </label>
                                                    <div className="w-full px-3 py-2 bg-slate-100 border rounded text-slate-700">
                                                        {formattedKembalian}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleBayar}
                                            disabled={stokBelanja.length === 0 || isTunaiInvalid || !metodepembayaran}
                                            className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

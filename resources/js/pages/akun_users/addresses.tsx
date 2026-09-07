import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { MapPin, PencilIcon, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    destroy as deleteAddress,
    index as listAddresses,
    store as createAddress,
    update as updateAddress,
} from '@/actions/App/Http/Controllers/AddressController';
import AppLayout from '@/layouts/app-layout';
import { myprofile } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface Address {
    id: number;
    label: string | null;
    nama_penerima: string;
    no_hp: string;
    provinsi_id: string | null;
    provinsi: string | null;
    kota_id: string | null;
    kota: string | null;
    alamat: string;
    is_default: boolean;
}

interface AddressesPageProps extends InertiaPageProps {
    addresses: Address[];
}

interface AddressFormData {
    label: string;
    nama_penerima: string;
    no_hp: string;
    provinsi: string;
    kota: string;
    alamat: string;
    is_default: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Profile', href: myprofile().url },
    { title: 'Alamat Saya', href: listAddresses().url },
];

const emptyForm: AddressFormData = {
    label: '',
    nama_penerima: '',
    no_hp: '',
    provinsi: '',
    kota: '',
    alamat: '',
    is_default: false,
};

export default function AddressesPage() {
    const { addresses: items } = usePage<AddressesPageProps>().props;

    const [editing, setEditing] = useState<Address | null>(null);
    const [showForm, setShowForm] = useState(false);

    const form = useForm<AddressFormData>(emptyForm);

    const openCreate = () => {
        setEditing(null);
        form.reset();
        setShowForm(true);
    };

    const openEdit = (address: Address) => {
        setEditing(address);
        form.reset();
        form.setData({
            label: address.label ?? '',
            nama_penerima: address.nama_penerima,
            no_hp: address.no_hp,
            provinsi: address.provinsi ?? '',
            kota: address.kota ?? '',
            alamat: address.alamat,
            is_default: address.is_default,
        });
        setShowForm(true);
    };

    const submit = () => {
        if (editing) {
            form.put(updateAddress.url({ address: editing.id }), {
                preserveScroll: true,
            });
        } else {
            form.post(createAddress.url(), { preserveScroll: true });
        }
    };

    const remove = (address: Address) => {
        if (!window.confirm('Yakin ingin menghapus alamat ini?')) {
            return;
        }

        router.delete(deleteAddress.url(address), { preserveScroll: true });
    };

    const inputClass =
        'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Alamat Saya" />

            <main className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                            <MapPin className="h-7 w-7 text-indigo-500" />
                            Alamat Saya
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Kelola alamat pengiriman untuk checkout yang lebih
                            cepat.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Alamat
                    </button>
                </div>

                {items.length === 0 && !showForm && (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-800">
                        <MapPin className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                            Belum ada alamat. Tambahkan alamat pengiriman
                            pertamamu.
                        </p>
                    </div>
                )}

                {items.map((address) => (
                    <div
                        key={address.id}
                        className="mb-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {address.label || address.nama_penerima}
                                    </span>
                                    {address.is_default && (
                                        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                                            Alamat Utama
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                    {address.nama_penerima} · {address.no_hp}
                                </p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {address.alamat}
                                </p>
                                {(address.kota || address.provinsi) && (
                                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                        {[address.kota, address.provinsi]
                                            .filter(Boolean)
                                            .join(', ')}
                                    </p>
                                )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => openEdit(address)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
                                    title="Ubah"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => remove(address)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-red-900/30"
                                    title="Hapus"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {showForm && (
                    <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm dark:border-indigo-800 dark:bg-gray-800">
                        <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-100">
                            {editing ? 'Ubah Alamat' : 'Tambah Alamat Baru'}
                        </h2>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                submit();
                            }}
                            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                        >
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Label (opsional)
                                </label>
                                <input
                                    type="text"
                                    value={form.data.label}
                                    onChange={(e) =>
                                        form.setData('label', e.target.value)
                                    }
                                    className={inputClass}
                                    placeholder="Rumah / Kantor"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nama Penerima
                                </label>
                                <input
                                    type="text"
                                    value={form.data.nama_penerima}
                                    onChange={(e) =>
                                        form.setData(
                                            'nama_penerima',
                                            e.target.value,
                                        )
                                    }
                                    className={inputClass}
                                />
                                {form.errors.nama_penerima && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.errors.nama_penerima}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nomor HP
                                </label>
                                <input
                                    type="text"
                                    value={form.data.no_hp}
                                    onChange={(e) =>
                                        form.setData('no_hp', e.target.value)
                                    }
                                    className={inputClass}
                                />
                                {form.errors.no_hp && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.errors.no_hp}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Provinsi
                                </label>
                                <input
                                    type="text"
                                    value={form.data.provinsi}
                                    onChange={(e) =>
                                        form.setData(
                                            'provinsi',
                                            e.target.value,
                                        )
                                    }
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Kota / Kabupaten
                                </label>
                                <input
                                    type="text"
                                    value={form.data.kota}
                                    onChange={(e) =>
                                        form.setData('kota', e.target.value)
                                    }
                                    className={inputClass}
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Alamat Lengkap
                                </label>
                                <textarea
                                    value={form.data.alamat}
                                    onChange={(e) =>
                                        form.setData('alamat', e.target.value)
                                    }
                                    rows={3}
                                    className={inputClass}
                                    placeholder="Jalan, gedung, RT/RW, kelurahan, kecamatan..."
                                />
                                {form.errors.alamat && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.errors.alamat}
                                    </p>
                                )}
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_default}
                                    onChange={(e) =>
                                        form.setData(
                                            'is_default',
                                            e.target.checked,
                                        )
                                    }
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Jadikan alamat utama
                            </label>
                            <div className="flex items-center gap-3 sm:col-span-2">
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {form.processing
                                        ? 'Menyimpan...'
                                        : editing
                                          ? 'Simpan Perubahan'
                                          : 'Simpan Alamat'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </AppLayout>
    );
}
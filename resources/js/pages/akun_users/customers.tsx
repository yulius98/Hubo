import {
    UserPlusIcon,
    PencilIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { customers } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    points: number;
    outlet_id: number | null;
    outlet?: { id: number; nama_outlet: string } | null;
}

interface CustomersPageProps extends InertiaPageProps {
    customers: {
        data: Customer[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    outlets: { id: number; nama_outlet: string }[];
    selectedOutletId: number;
}

interface CustomerFormData {
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
    outlet_id: number | '';
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pelanggan', href: customers().url },
];

export default function CustomersPage() {
    const {
        customers: paginator,
        outlets,
        selectedOutletId,
    } = usePage<CustomersPageProps>().props;

    const [editing, setEditing] = useState<Customer | null>(null);
    const [showForm, setShowForm] = useState(false);

    const form = useForm<CustomerFormData>({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        outlet_id: selectedOutletId || '',
    });

    const openCreate = () => {
        setEditing(null);
        form.reset();
        form.setData('outlet_id', selectedOutletId || '');
        setShowForm(true);
    };

    const openEdit = (customer: Customer) => {
        setEditing(customer);
        form.setData({
            name: customer.name,
            email: customer.email ?? '',
            phone: customer.phone ?? '',
            address: customer.address ?? '',
            notes: customer.notes ?? '',
            outlet_id: customer.outlet_id ?? '',
        });
        setShowForm(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            form.put(`/customers/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowForm(false);
                    setEditing(null);
                },
            });
        } else {
            form.post('/customers', {
                preserveScroll: true,
                onSuccess: () => {
                    setShowForm(false);
                },
            });
        }
    };

    const destroy = (customer: Customer) => {
        if (confirm(`Hapus pelanggan "${customer.name}"?`)) {
            router.delete(`/customers/${customer.id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pelanggan" />
            <main className="mx-auto max-w-6xl p-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-800 md:text-3xl dark:text-gray-100">
                            Manajemen Pelanggan
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Kelola data pelanggan untuk layanan kasir dan
                            program loyalty.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    >
                        <UserPlusIcon className="h-5 w-5" />
                        Tambah Pelanggan
                    </button>
                </div>

                {form.errors.name && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        {form.errors.name}
                    </div>
                )}

                {showForm && (
                    <form
                        onSubmit={submit}
                        className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                        <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-100">
                            {editing
                                ? `Edit Pelanggan: ${editing.name}`
                                : 'Tambah Pelanggan Baru'}
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nama *
                                </label>
                                <input
                                    type="text"
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) =>
                                        form.setData('email', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    No. HP
                                </label>
                                <input
                                    type="text"
                                    value={form.data.phone}
                                    onChange={(e) =>
                                        form.setData('phone', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Outlet
                                </label>
                                <select
                                    value={String(form.data.outlet_id)}
                                    onChange={(e) =>
                                        form.setData(
                                            'outlet_id',
                                            e.target.value
                                                ? Number(e.target.value)
                                                : '',
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                >
                                    <option value="">Semua Outlet</option>
                                    {outlets.map((outlet) => (
                                        <option
                                            key={outlet.id}
                                            value={outlet.id}
                                        >
                                            {outlet.nama_outlet}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Alamat
                                </label>
                                <textarea
                                    value={form.data.address}
                                    onChange={(e) =>
                                        form.setData('address', e.target.value)
                                    }
                                    rows={2}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Catatan
                                </label>
                                <textarea
                                    value={form.data.notes}
                                    onChange={(e) =>
                                        form.setData('notes', e.target.value)
                                    }
                                    rows={2}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="mt-5 flex gap-2">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                            >
                                {editing ? 'Simpan Perubahan' : 'Tambah'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="rounded-xl bg-gray-200 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                )}

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                            Daftar Pelanggan
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Total:{' '}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {paginator.total}
                            </span>
                        </span>
                    </div>

                    {paginator.data.length === 0 ? (
                        <div className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                            Belum ada data pelanggan.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:border-gray-700 dark:text-gray-400">
                                        <th className="px-5 py-3">Nama</th>
                                        <th className="px-5 py-3">Kontak</th>
                                        <th className="px-5 py-3">Outlet</th>
                                        <th className="px-5 py-3 text-right">
                                            Poin
                                        </th>
                                        <th className="px-5 py-3 text-right">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginator.data.map((customer) => (
                                        <tr
                                            key={customer.id}
                                            className="border-b border-gray-100 last:border-0 dark:border-gray-700/60"
                                        >
                                            <td className="px-5 py-3">
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {customer.name}
                                                </p>
                                                {customer.notes && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {customer.notes}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                {customer.email && (
                                                    <p className="text-gray-700 dark:text-gray-300">
                                                        {customer.email}
                                                    </p>
                                                )}
                                                {customer.phone && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {customer.phone}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                {customer.outlet ? (
                                                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                                        {
                                                            customer.outlet
                                                                .nama_outlet
                                                        }
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                                                {customer.points}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEdit(customer)
                                                        }
                                                        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            destroy(customer)
                                                        }
                                                        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                                                        title="Hapus"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {paginator.last_page > 1 && (
                        <div className="flex flex-wrap items-center gap-1 border-t border-gray-200 px-5 py-3.5 dark:border-gray-700">
                            {paginator.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    preserveScroll
                                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                        link.active
                                            ? 'bg-blue-600 font-semibold text-white'
                                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                    } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}

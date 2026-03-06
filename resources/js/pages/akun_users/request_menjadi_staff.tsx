import AppLayout from '@/layouts/app-layout'
import { Head, usePage } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types'
import { req_staff } from '@/routes';
import React, { useState, useEffect, useRef } from 'react'
import { router, type PageProps as InertiaPageProps } from '@inertiajs/core'
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    XMarkIcon,
    UserPlusIcon,
    EyeIcon,
} from '@heroicons/react/24/outline'

interface Outlet {
    id: number,
    gambar: string,
    nama_outlet: string,
    kota: string,
    owner?: Array<{
        id: number,
        name: string,
        email: string
    }>
}

// interface Role {
//     id: number
//     role: string
// }

// interface OutletPaginator {
//     data: Outlet[]
//     current_page: number
//     last_page: number
//     per_page: number
//     total: number
// }

// interface OutletPageProps extends InertiaPageProps {
//     outlets: OutletPaginator | Outlet[]
//     jmlOutlet: number
//     role: Role[]
// }

interface RequestUserPageProps {
    outlets: Outlet[]
    jmlOutlet: number
    user_id: number

}


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Permintaan Menjadi Karyawan/Staff',
        href: req_staff().url,
    },
];

export default function request_menjadi_staff({ outlets, jmlOutlet, user_id}: RequestUserPageProps) {
    const [error, setError] = useState("")
    const [editId, setEditId] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const fetchOutletRef = useRef<(() => void) | null>(null)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [selectedRoles, setSelectedRoles] = useState<Record<number, number>>({})
    const totalPages = Math.max(1, Math.ceil(jmlOutlet / limit))
    const [preview, setPreview] = useState<string | null>(null)


    const [formData, setFormData] = useState({
        outlet_id: '',
        role_id: '',
        owner_id: '',
        owner: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target

        // Jika yang diubah adalah outlet_id
        if (name === 'outlet_id' && value) {
            // Cari outlet yang dipilih
            const selectedOutlet = outlets.find(outlet => outlet.id === Number(value))

            if (selectedOutlet && selectedOutlet.owner && selectedOutlet.owner.length > 0) {
                // Set owner_id dan owner name
                setFormData(prev => ({
                    ...prev,
                    [name]: value,
                    owner_id: selectedOutlet.owner![0].id.toString(),
                    owner: `${selectedOutlet.owner![0].name} (${selectedOutlet.owner![0].email})`
                }))
                return
            }
        }

        // Untuk field lainnya
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handlerequest = async (e: any) => {
        e.preventDefault();
        try {
            const datatoSend = {
                id_staff: user_id,
                id_owner: Number(formData.owner_id),
                id_role: Number(formData.role_id),
                id_outlet: Number(formData.outlet_id),
                status: 'pending',
            }
            console.log('data yang dikirim :', datatoSend)

            router.post("/req_staff", datatoSend,   {
                onSuccess: () => {
                    setFormData({
                        outlet_id: '',
                        role_id: '',
                        owner_id: '',
                        owner: '',
                    })
                },
                onError: (errors) => {
                    console.log(errors)
                }
            })

        } catch (err) {
            setError("Gagal request")
            // Tampilkan error detail dari backend jika ada
            console.log('Error response:', err)
        }

    }


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title= 'Permintaan Menjadi Karyawan/Staff' />
            <main className="p-6 max-w-8xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                    Permintaan Menjadi Karyawan/Staff
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Pilih Outlet dan Role.
                    </p>
                </div>

                {/* Card: Form Request */}
                <div className="mb-8 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            Form Request
                        </h2>
                    </div>

                    <div className="p-6 pt-4">
                        <form onSubmit={handlerequest}>
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="flex-1 min-w-[200px]">
                                    <label
                                        htmlFor="nama_outlet"
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                                    >
                                        Pilih Outlet
                                    </label>
                                    <select
                                        id="outlet_id"
                                        name="outlet_id"
                                        value={formData.outlet_id ?? ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">Pilih Outlet</option>
                                            {outlets.map((item) => (
                                        <option key={item.id} value={item.id}>{item.nama_outlet}</option>

                                        ))}
                                    </select>
                                    <label
                                        htmlFor="nama_outlet"
                                        className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                                    >
                                        Nama Pemilik Outlet
                                    </label>
                                    <input
                                        type="text"
                                        id="owner"
                                        name="owner"
                                        value={formData.owner}
                                        onChange={handleChange}
                                        readOnly
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors"
                                    />
                                    <label
                                        htmlFor="role"
                                        className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                                    >
                                        Pilih Role
                                    </label>
                                    <select
                                        id="role_id"
                                        name="role_id"
                                        value={formData.role_id}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">Pilih Role</option>
                                        <option value="3">Admin Outlet</option>
                                        <option value="5">Kasir Outlet</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type='submit'
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                            >Submit</button>
                        </form>
                    </div>
                </div>

                <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            Status Request
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full" id="tabel_produk">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700/50">
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-20">
                                        No
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                        Nama Outlet
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                        Status
                                    </th>

                                </tr>
                            </thead>
                        </table>
                    </div>
                </div>
            </main>
        </AppLayout>
    )
}

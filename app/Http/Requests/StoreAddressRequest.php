<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'label' => ['nullable', 'string', 'max:50'],
            'nama_penerima' => ['required', 'string', 'max:120'],
            'no_hp' => ['required', 'string', 'max:25'],
            'provinsi_id' => ['nullable', 'string', 'max:20'],
            'provinsi' => ['nullable', 'string', 'max:100'],
            'kota_id' => ['nullable', 'string', 'max:20'],
            'kota' => ['nullable', 'string', 'max:100'],
            'alamat' => ['required', 'string', 'max:1000'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nama_penerima.required' => 'Nama penerima wajib diisi.',
            'no_hp.required' => 'Nomor HP wajib diisi.',
            'alamat.required' => 'Alamat lengkap wajib diisi.',
        ];
    }
}

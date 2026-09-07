<?php

namespace App\Http\Requests;

use App\Models\Address;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $address = $this->route('address');

        if (! $user || ! $address instanceof Address) {
            return false;
        }

        return $address->user_id === $user->id;
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

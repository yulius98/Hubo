<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanySettingRequest extends FormRequest
{
    /**
     * The tenant owner is allowed to change their business profile.
     */
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
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-_]+$/', Rule::unique('companies', 'slug')->ignore($this->user()?->company_id)],
            'logo' => ['nullable', 'string', 'max:255'],
            'alamat_bisnis' => ['nullable', 'string', 'max:1000'],
            'konfigurasi_pajak_ppn' => ['nullable', 'string', 'in:10,11', 'max:5'],
            'ongkir_kota_default' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama usaha wajib diisi.',
            'slug.required' => 'Slug usaha wajib diisi.',
            'slug.unique' => 'Slug usaha sudah digunakan.',
            'konfigurasi_pajak_ppn.in' => 'Tarif pajak tidak valid.',
        ];
    }
}

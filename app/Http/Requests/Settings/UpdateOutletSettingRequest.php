<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOutletSettingRequest extends FormRequest
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
            'nama_outlet' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-_]+$/', Rule::unique('outlets', 'slug')->ignore($this->route('outlet')->id ?? null)],
            'alamat_outlet' => ['nullable', 'string', 'max:1000'],
            'kota' => ['nullable', 'string', 'max:255'],
            'telp' => ['nullable', 'string', 'max:20'],
            'logo' => ['nullable', 'string', 'max:255'],
            'banner' => ['nullable', 'string', 'max:255'],
            'jam_buka' => ['nullable', 'string', 'max:255'],
            'mata_uang' => ['nullable', 'string', 'max:10'],
            'alamat_pengiriman_default' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'nama_outlet.required' => 'Nama outlet wajib diisi.',
            'slug.unique' => 'Slug outlet sudah digunakan.',
        ];
    }
}

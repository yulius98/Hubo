<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;

class FinishRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'konfigurasi_pajak_ppn' => ['nullable', 'string', 'in:10,11', 'max:5'],
            'ongkir_kota_default' => ['nullable', 'string', 'max:255'],
            'mata_uang' => ['nullable', 'string', 'max:10'],
            'alamat_pengiriman_default' => ['nullable', 'string', 'max:1000'],
        ];
    }
}

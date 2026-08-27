<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kategori' => ['required', 'string', 'in:sewa,gaji,listrik,air,transport,lainnya'],
            'jumlah' => ['required', 'numeric', 'min:0'],
            'tanggal' => ['required', 'date'],
            'keterangan' => ['nullable', 'string', 'max:500'],
            'outlet_id' => ['nullable', 'exists:outlets,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'kategori.required' => 'Kategori tidak valid.',
            'kategori.in' => 'Kategori tidak valid.',
            'jumlah.required' => 'Jumlah harus lebih dari 0.',
            'jumlah.min' => 'Jumlah harus lebih dari 0.',
            'tanggal.required' => 'Tanggal wajib diisi.',
        ];
    }
}

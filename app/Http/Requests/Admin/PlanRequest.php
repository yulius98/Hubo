<?php

namespace App\Http\Requests\Admin;

use App\Http\Controllers\Admin\PaketController;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PlanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $slug = trim((string) $this->input('slug'));

        if ($slug === '') {
            $this->merge(['slug' => Str::slug((string) $this->input('name'))]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $planId = $this->route('plan')?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/', Rule::unique('plans', 'slug')->ignore($planId)],
            'description' => ['nullable', 'string', 'max:1000'],
            'price_monthly' => ['required', 'numeric', 'min:0', 'max:999999999999'],
            'max_outlets' => ['nullable', 'integer', 'min:0'],
            'max_products' => ['nullable', 'integer', 'min:0'],
            'max_staff' => ['nullable', 'integer', 'min:0'],
            'trial_days' => ['required', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', Rule::in(array_keys(PaketController::FEATURE_CATALOG))],
        ];
    }

    /**
     * Get the validation messages that apply to the request.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama paket wajib diisi.',
            'name.max' => 'Nama paket maksimal 255 karakter.',
            'slug.required' => 'Slug paket wajib diisi.',
            'slug.regex' => 'Slug hanya boleh berisi huruf kecil, angka, dan tanda strip.',
            'slug.unique' => 'Slug paket sudah digunakan.',
            'price_monthly.required' => 'Harga bulanan wajib diisi.',
            'price_monthly.min' => 'Harga bulanan tidak boleh negatif.',
            'trial_days.required' => 'Lama masa percobaan wajib diisi.',
            'trial_days.min' => 'Lama masa percobaan tidak boleh negatif.',
            'features.*.in' => 'Terdapat fitur yang tidak dikenal pada paket.',
        ];
    }
}

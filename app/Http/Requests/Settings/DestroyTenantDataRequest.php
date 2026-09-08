<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class DestroyTenantDataRequest extends FormRequest
{
    /**
     * Only the owner may purge the entire tenant.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasRole('owner outlet') ?? false;
    }

    /**
     * Typed confirmation prevents accidental deletion.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'confirmation' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'confirmation.required' => 'Ketik nama toko untuk mengonfirmasi penghapusan.',
        ];
    }
}

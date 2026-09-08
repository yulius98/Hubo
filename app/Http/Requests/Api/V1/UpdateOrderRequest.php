<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
{
    /**
     * Only scoped tokens may reach here; the scope itself is checked by the
     * `api.ability` middleware, so the request is always authorized.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['bail', 'required_without_all:tracking_number,courier', 'string', 'in:processing,shipped,completed,cancelled'],
            'tracking_number' => ['nullable', 'string', 'max:255'],
            'courier' => ['nullable', 'string', 'max:255'],
        ];
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAddressRequest;
use App\Http\Requests\UpdateAddressRequest;
use App\Models\Address;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AddressController extends Controller
{
    /**
     * Show the current user's address book.
     */
    public function index(Request $request): Response
    {
        $addresses = $request->user()
            ->addresses()
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('akun_users/addresses', [
            'addresses' => $addresses,
        ]);
    }

    /**
     * Store a new address for the current user.
     */
    public function store(StoreAddressRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $isDefault = (bool) ($validated['is_default'] ?? false);

        if ($isDefault) {
            $this->normalizeDefault($request->user()->id);
        }

        $address = $request->user()->addresses()->create([
            ...$validated,
            'is_default' => $isDefault,
        ]);

        return redirect()->route('user.addresses')
            ->with('success', $address->is_default
                ? 'Alamat berhasil disimpan sebagai alamat utama.'
                : 'Alamat berhasil disimpan.');
    }

    /**
     * Update an existing address.
     */
    public function update(UpdateAddressRequest $request, Address $address): RedirectResponse
    {
        $validated = $request->validated();

        $isDefault = (bool) ($validated['is_default'] ?? $address->is_default);

        if ($isDefault) {
            $this->normalizeDefault($address->user_id);
        }

        $address->update([
            ...$validated,
            'is_default' => $isDefault,
        ]);

        return redirect()->route('user.addresses')
            ->with('success', 'Alamat berhasil diperbarui.');
    }

    /**
     * Remove an address. The address must belong to the current user.
     */
    public function destroy(Request $request, Address $address): RedirectResponse
    {
        abort_unless($address->user_id === $request->user()->id, 403);

        $address->delete();

        return redirect()->route('user.addresses')
            ->with('success', 'Alamat berhasil dihapus.');
    }

    /**
     * Clear the default flag on every address belonging to the user.
     */
    private function normalizeDefault(int $userId): void
    {
        Address::query()->where('user_id', $userId)->update(['is_default' => false]);
    }
}

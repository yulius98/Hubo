<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\DestroyTenantDataRequest;
use App\Jobs\DestroyTenantDataJob;
use App\Jobs\ExportTenantDataJob;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TenantDataController extends Controller
{
    /**
     * Show the data export and purge page.
     */
    public function index(): Response
    {
        return Inertia::render('settings/data', [
            'companyName' => auth()->user()->company?->name ?? '',
        ]);
    }

    /**
     * Queue an offline snapshot; the owner is notified when it is ready.
     */
    public function export(Request $request): RedirectResponse
    {
        ExportTenantDataJob::dispatch($request->user()->id);

        return back()->with('success', 'Salinan data sedang disiapkan. Anda akan mendapat notifikasi saat siap diunduh.');
    }

    /**
     * Download a finished export through a one-time signed URL.
     */
    public function download(Request $request): StreamedResponse
    {
        $file = (string) $request->query('file', '');

        abort_unless(
            Storage::disk('tenant-data')->exists($file)
                && str_contains($file, '/') === false
                && Str::endsWith($file, '.json'),
            404
        );

        return Storage::disk('tenant-data')->download($file, null, [
            'Content-Type' => 'application/json',
        ]);
    }

    /**
     * Purge the whole company after a typed confirmation, then sign out.
     */
    public function destroy(DestroyTenantDataRequest $request): RedirectResponse
    {
        $company = $request->user()->company;

        abort_unless($company !== null, 404);

        if (! Str::of($request->validated('confirmation'))->trim()->exactly($company->name)) {
            return back()->withErrors(['confirmation' => 'Teks konfirmasi tidak cocok dengan nama toko.']);
        }

        DestroyTenantDataJob::dispatch($company->id);

        auth()->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('status', 'Data toko Anda telah dihapus. Terima kasih telah menggunakan Hubo.');
    }
}

<?php

namespace App\Jobs;

use App\Models\Company;
use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\DatabaseManager;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DestroyTenantDataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 3600;

    public function __construct(public int $companyId) {}

    /**
     * Hard-delete every record belonging to the tenant, leaving sibling
     * companies untouched.
     */
    public function handle(DatabaseManager $db): void
    {
        $company = Company::with('outlets')->find($this->companyId);

        if ($company === null) {
            return;
        }

        $outletIds = $company->outlets->pluck('id')->all();
        $staff = User::where('company_id', $company->id)->get();

        $dispatcher = Model::getEventDispatcher();
        Model::unsetEventDispatcher();

        try {
            $db->transaction(function () use ($company, $staff, $outletIds) {
                foreach ($staff as $user) {
                    $user->role()->detach();
                    $user->outlets()->detach();
                    $user->tokens()->delete();
                    $user->notifications()->delete();
                    $user->forceDelete();
                }

                Order::whereIn('outlet_id', $outletIds)->forceDelete();

                foreach ($company->outlets as $outlet) {
                    $outlet->forceDelete();
                }

                $company->forceDelete();
            });
        } finally {
            Model::setEventDispatcher($dispatcher);
        }
    }
}

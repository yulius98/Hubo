<?php

use App\Models\Role;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $role = Role::where('role', 'admin app')->first();

        if ($role) {
            DB::table('role_user')->where('role_id', $role->id)->delete();
            DB::table('outlet_user')->where('role_id', $role->id)->delete();

            $role->delete();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Role::withTrashed()->updateOrCreate(
            ['role' => 'admin app'],
            ['role' => 'admin app']
        );
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('tax', 15, 2)->default(0)->after('subtotal');
            $table->decimal('tax_rate', 5, 2)->default(0)->after('tax');
            $table->string('tax_code')->nullable()->after('tax_rate');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->json('tax_breakdown')->nullable()->after('tax');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['tax', 'tax_rate', 'tax_code']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('tax_breakdown');
        });
    }
};

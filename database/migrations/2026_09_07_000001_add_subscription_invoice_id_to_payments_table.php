<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->unsignedBigInteger('order_id')->nullable()->change();
            $table->unsignedBigInteger('subscription_invoice_id')->nullable()->after('order_id');
            $table->foreign('subscription_invoice_id')
                ->references('id')
                ->on('subscription_invoices')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['subscription_invoice_id']);
            $table->dropColumn('subscription_invoice_id');
            $table->unsignedBigInteger('order_id')->nullable(false)->change();
        });
    }
};

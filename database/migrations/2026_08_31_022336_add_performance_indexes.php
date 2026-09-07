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
        Schema::table('transaksis', function (Blueprint $table) {
            $table->index(['id_outlet', 'tgl_transaksi'], 'transaksis_outlet_tgl_idx');
            $table->index(['id_outlet', 'jenis_transaksi', 'tgl_transaksi'], 'transaksis_outlet_jenis_tgl_idx');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index(['user_id', 'status'], 'orders_user_status_idx');
            $table->index('status', 'orders_status_idx');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->index(['outlet_id', 'tanggal'], 'expenses_outlet_tanggal_idx');
        });

        Schema::table('request_roles', function (Blueprint $table) {
            $table->index(['owner_id', 'status'], 'request_roles_owner_status_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('request_roles', function (Blueprint $table) {
            $table->dropIndex('request_roles_owner_status_idx');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex('expenses_outlet_tanggal_idx');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_user_status_idx');
            $table->dropIndex('orders_status_idx');
        });

        Schema::table('transaksis', function (Blueprint $table) {
            $table->dropIndex('transaksis_outlet_tgl_idx');
            $table->dropIndex('transaksis_outlet_jenis_tgl_idx');
        });
    }
};

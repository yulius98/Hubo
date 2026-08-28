<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('keranjang_belanja_users', function (Blueprint $table) {
            $table->unsignedBigInteger('variant_id')->nullable()->after('id_produk');
            $table->foreign('variant_id')->references('id')->on('product_variants')->onDelete('set null');
        });

        Schema::table('keranjang_belanja_kasirs', function (Blueprint $table) {
            $table->unsignedBigInteger('variant_id')->nullable()->after('id_produk');
            $table->foreign('variant_id')->references('id')->on('product_variants')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('keranjang_belanja_kasirs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('variant_id');
        });

        Schema::table('keranjang_belanja_users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('variant_id');
        });
    }
};

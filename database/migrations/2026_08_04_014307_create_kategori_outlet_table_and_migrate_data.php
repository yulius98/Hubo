<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('kategori_outlet', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_kategori')->constrained('kategoris')->cascadeOnDelete();
            $table->foreignId('id_outlet')->constrained('outlets')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['id_kategori', 'id_outlet']);
        });

        DB::table('kategori_outlet')->insertUsing(
            ['id_kategori', 'id_outlet'],
            DB::table('kategoris')
                ->select('id as id_kategori', 'id_outlet')
                ->whereNotNull('id_outlet')
        );

        Schema::table('kategoris', function (Blueprint $table) {
            $table->dropForeign(['id_outlet']);
            $table->dropColumn('id_outlet');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kategoris', function (Blueprint $table) {
            $table->unsignedBigInteger('id_outlet')->nullable()->after('id_user');
            $table->foreign('id_outlet')->references('id')->on('outlets')->onDelete('cascade');
        });

        DB::table('kategori_outlet')
            ->orderBy('id_kategori')
            ->orderBy('id')
            ->get(['id_kategori', 'id_outlet'])
            ->groupBy('id_kategori')
            ->each(function ($links) {
                DB::table('kategoris')
                    ->where('id', $links->first()->id_kategori)
                    ->update(['id_outlet' => $links->first()->id_outlet]);
            });

        Schema::dropIfExists('kategori_outlet');
    }
};

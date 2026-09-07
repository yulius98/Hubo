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
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('label')->nullable();
            $table->string('nama_penerima');
            $table->string('no_hp');
            $table->string('provinsi_id')->nullable();
            $table->string('provinsi')->nullable();
            $table->string('kota_id')->nullable();
            $table->string('kota')->nullable();
            $table->text('alamat');
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};

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
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('key');
            $table->text('value')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'key']);
        });

        Schema::table('outlets', function (Blueprint $table) {
            $table->string('logo')->nullable()->after('gambar');
            $table->string('banner')->nullable()->after('logo');
            $table->string('jam_buka')->nullable()->after('telp');
            $table->string('mata_uang', 10)->nullable()->after('jam_buka');
            $table->text('alamat_pengiriman_default')->nullable()->after('mata_uang');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->dropColumn(['alamat_pengiriman_default', 'mata_uang', 'jam_buka', 'banner', 'logo']);
        });

        Schema::dropIfExists('company_settings');
    }
};

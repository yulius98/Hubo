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
        Schema::create('request_roles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_staff');
            $table->foreign('id_staff')->references('id')->on('users')->onDelete('cascade');
            $table->unsignedBigInteger('id_owner');
            $table->foreign('id_owner')->references('id')->on('users')->onDelete('cascade');
            $table->unsignedBigInteger('id_role');
            $table->foreign('id_role')->references('id')->on('roles')->onDelete('cascade');
            $table->unsignedBigInteger('id_outlet');
            $table->foreign('id_outlet')->references('id')->on('outlets')->onDelete('cascade');
            $table->enum('status',['pending','done'])->default('pending');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('request_roles');
    }
};

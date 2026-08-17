<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->string('payment_number')->unique();
            $table->string('gateway')->nullable();
            $table->string('gateway_ref')->nullable();
            $table->string('payment_method')->nullable();
            $table->decimal('amount', 15, 2);
            $table->enum('status', [
                'pending',
                'processing',
                'success',
                'failed',
                'expired',
                'refunded',
            ])->default('pending');
            $table->json('gateway_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

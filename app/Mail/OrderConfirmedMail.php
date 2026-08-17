<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pesanan Dikonfirmasi - '.$this->order->order_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildHtml(),
        );
    }

    private function buildHtml(): string
    {
        $order = $this->order;
        $userName = e($order->user->name);
        $orderNumber = e($order->order_number);
        $orderUrl = route('orders.show', $order->id);
        $total = number_format($order->total, 0, ',', '.');

        return "
        <div style='max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif'>
            <div style='background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center'>
                <h1 style='color:#ffffff;font-size:24px;margin:0 0 8px'>Pesanan Diterima</h1>
                <p style='color:rgba(255,255,255,0.85);font-size:14px;margin:0'>Pesanan Anda telah kami terima</p>
            </div>
            <div style='background:#ffffff;padding:32px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px'>
                <p style='font-size:15px;color:#374151;line-height:1.6'>Halo <strong>{$userName}</strong>,</p>
                <p style='font-size:15px;color:#374151;line-height:1.6'>Terima kasih telah melakukan pemesanan. Pesanan Anda dengan nomor <strong>{$orderNumber}</strong> telah kami terima dan sedang diproses.</p>

                <div style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:24px 0'>
                    <p style='font-size:14px;color:#6b7280;margin:0 0 4px'>Nomor Pesanan</p>
                    <p style='font-size:16px;font-weight:bold;color:#111827;margin:0'>{$orderNumber}</p>
                    <p style='font-size:14px;color:#6b7280;margin:12px 0 4px'>Total Pembayaran</p>
                    <p style='font-size:18px;font-weight:bold;color:#6366f1;margin:0'>Rp {$total}</p>
                </div>

                <p style='font-size:15px;color:#374151;line-height:1.6'>Silakan selesaikan pembayaran Anda. Anda dapat melihat detail pesanan dan melakukan pembayaran melalui tautan di bawah ini:</p>

                <div style='text-align:center;margin:24px 0'>
                    <a href='{$orderUrl}' style='display:inline-block;background:#6366f1;color:#ffffff;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px'>Lihat Pesanan</a>
                </div>

                <p style='font-size:13px;color:#9ca3af;text-align:center;margin-top:24px'>Email ini dikirim secara otomatis. Hubungi kami jika ada pertanyaan.</p>
            </div>
        </div>";
    }
}

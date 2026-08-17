<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderShippedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pesanan Dikirim - '.$this->order->order_number,
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
        $shippingAddress = e($order->shipping_address);
        $orderUrl = route('orders.show', $order->id);

        return "
        <div style='max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif'>
            <div style='background:linear-gradient(135deg,#3b82f6,#06b6d4);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center'>
                <h1 style='color:#ffffff;font-size:24px;margin:0 0 8px'>Pesanan Dikirim</h1>
                <p style='color:rgba(255,255,255,0.85);font-size:14px;margin:0'>Pesanan Anda sedang dalam perjalanan</p>
            </div>
            <div style='background:#ffffff;padding:32px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px'>
                <p style='font-size:15px;color:#374151;line-height:1.6'>Halo <strong>{$userName}</strong>,</p>
                <p style='font-size:15px;color:#374151;line-height:1.6'>Pesanan Anda dengan nomor <strong>{$orderNumber}</strong> telah dikirim dan sedang dalam perjalanan ke alamat Anda.</p>

                <div style='background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:24px 0;text-align:center'>
                    <p style='font-size:14px;color:#1e40af;margin:0 0 4px'>Alamat Pengiriman</p>
                    <p style='font-size:14px;color:#1e3a8a;font-weight:600;margin:0'>{$shippingAddress}</p>
                </div>

                <div style='text-align:center;margin:24px 0'>
                    <a href='{$orderUrl}' style='display:inline-block;background:#3b82f6;color:#ffffff;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px'>Lacak Pesanan</a>
                </div>

                <p style='font-size:13px;color:#9ca3af;text-align:center;margin-top:24px'>Email ini dikirim secara otomatis. Hubungi kami jika ada pertanyaan.</p>
            </div>
        </div>";
    }
}

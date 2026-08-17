<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderPaidMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pembayaran Diterima - '.$this->order->order_number,
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

        $items = $order->items->map(function ($item) {
            $name = e($item->product_name);
            $subtotal = number_format($item->subtotal, 0, ',', '.');

            return "
                <tr>
                    <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151'>{$name}</td>
                    <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;text-align:center'>{$item->quantity}</td>
                    <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;text-align:right'>Rp {$subtotal}</td>
                </tr>";
        })->implode('');

        $subtotal = number_format($order->subtotal, 0, ',', '.');
        $tax = number_format($order->tax, 0, ',', '.');
        $total = number_format($order->total, 0, ',', '.');

        return "
        <div style='max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif'>
            <div style='background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center'>
                <h1 style='color:#ffffff;font-size:24px;margin:0 0 8px'>Pembayaran Diterima</h1>
                <p style='color:rgba(255,255,255,0.85);font-size:14px;margin:0'>Pesanan {$orderNumber} telah terbayar</p>
            </div>
            <div style='background:#ffffff;padding:32px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px'>
                <p style='font-size:15px;color:#374151;line-height:1.6'>Halo <strong>{$userName}</strong>,</p>
                <p style='font-size:15px;color:#374151;line-height:1.6'>Pembayaran untuk pesanan Anda telah berhasil diterima. Pesanan Anda akan segera diproses.</p>

                <table style='width:100%;border-collapse:collapse;margin:24px 0'>
                    <thead>
                        <tr style='background:#f9fafb'>
                            <th style='padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase'>Item</th>
                            <th style='padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase'>Qty</th>
                            <th style='padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase'>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>{$items}</tbody>
                    <tfoot>
                        <tr>
                            <td colspan='2' style='padding:10px 12px;font-size:14px;color:#6b7280;text-align:right'>Subtotal</td>
                            <td style='padding:10px 12px;font-size:14px;color:#374151;text-align:right'>Rp {$subtotal}</td>
                        </tr>
                        <tr>
                            <td colspan='2' style='padding:10px 12px;font-size:14px;color:#6b7280;text-align:right'>PPN (11%)</td>
                            <td style='padding:10px 12px;font-size:14px;color:#374151;text-align:right'>Rp {$tax}</td>
                        </tr>
                        <tr>
                            <td colspan='2' style='padding:12px 12px;font-size:16px;font-weight:bold;color:#111827;text-align:right;border-top:2px solid #e5e7eb'>Total</td>
                            <td style='padding:12px 12px;font-size:16px;font-weight:bold;color:#111827;text-align:right;border-top:2px solid #e5e7eb'>Rp {$total}</td>
                        </tr>
                    </tfoot>
                </table>

                <div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:24px 0;text-align:center'>
                    <p style='font-size:14px;color:#166534;margin:0'>Terima kasih atas pembayaran Anda!</p>
                </div>

                <p style='font-size:13px;color:#9ca3af;text-align:center;margin-top:24px'>Email ini dikirim secara otomatis. Hubungi kami jika ada pertanyaan.</p>
            </div>
        </div>";
    }
}

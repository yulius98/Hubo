<?php

namespace App\Mail;

use App\Models\SubscriptionInvoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubscriptionInvoicePaidMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public SubscriptionInvoice $invoice,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pembayaran Diterima - '.$this->invoice->invoice_number,
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
        $invoice = $this->invoice;
        $company = $invoice->subscription?->company;
        $planName = $invoice->subscription?->plan?->name ?? 'Langganan';
        $companyName = e($company?->name ?? 'Pelanggan');
        $invoiceNumber = e($invoice->invoice_number);
        $periodStart = $invoice->period_start?->format('d M Y') ?? '—';
        $periodEnd = $invoice->period_end?->format('d M Y') ?? '—';
        $amount = number_format((float) $invoice->amount, 0, ',', '.');

        return "
        <div style='max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif'>
            <div style='background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center'>
                <h1 style='color:#ffffff;font-size:24px;margin:0 0 8px'>Pembayaran Langganan Diterima</h1>
                <p style='color:rgba(255,255,255,0.85);font-size:14px;margin:0'>Invoice {$invoiceNumber}</p>
            </div>
            <div style='background:#ffffff;padding:32px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px'>
                <p style='font-size:15px;color:#374151;line-height:1.6'>Halo <strong>{$companyName}</strong>,</p>
                <p style='font-size:15px;color:#374151;line-height:1.6'>
                    Pembayaran tagihan langganan Anda telah berhasil diterima. Paket <strong>{$planName}</strong> Anda tetap aktif.
                </p>

                <table style='width:100%;border-collapse:collapse;margin:24px 0'>
                    <tr>
                        <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280'>Nomor Invoice</td>
                        <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;text-align:right'>{$invoiceNumber}</td>
                    </tr>
                    <tr>
                        <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280'>Periode</td>
                        <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;text-align:right'>{$periodStart} — {$periodEnd}</td>
                    </tr>
                    <tr>
                        <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280'>Paket</td>
                        <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;text-align:right'>{$planName}</td>
                    </tr>
                    <tr>
                        <td style='padding:12px;font-size:16px;font-weight:bold;color:#111827;border-top:2px solid #e5e7eb'>Total Dibayar</td>
                        <td style='padding:12px;font-size:16px;font-weight:bold;color:#111827;text-align:right;border-top:2px solid #e5e7eb'>Rp {$amount}</td>
                    </tr>
                </table>

                <div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:24px 0;text-align:center'>
                    <p style='font-size:14px;color:#166534;margin:0'>Terima kasih! Langganan Anda aktif hingga {$periodEnd}.</p>
                </div>

                <p style='font-size:13px;color:#9ca3af;text-align:center;margin-top:24px'>Email ini dikirim secara otomatis. Hubungi kami jika ada pertanyaan.</p>
            </div>
        </div>";
    }
}

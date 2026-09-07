<?php

namespace App\Mail;

use App\Models\SubscriptionInvoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubscriptionBillingReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public SubscriptionInvoice $invoice,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pengingat Tagihan - '.$this->invoice->invoice_number,
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
        $dueDate = $invoice->period_end?->format('d M Y') ?? '—';
        $amount = number_format((float) $invoice->amount, 0, ',', '.');

        return "
        <div style='max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif'>
            <div style='background:linear-gradient(135deg,#f59e0b,#ef4444);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center'>
                <h1 style='color:#ffffff;font-size:24px;margin:0 0 8px'>Pengingat Pembayaran</h1>
                <p style='color:rgba(255,255,255,0.85);font-size:14px;margin:0'>Tagihan langganan Anda mendekati jatuh tempo</p>
            </div>
            <div style='background:#ffffff;padding:32px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px'>
                <p style='font-size:15px;color:#374151;line-height:1.6'>Halo <strong>{$companyName}</strong>,</p>
                <p style='font-size:15px;color:#374151;line-height:1.6'>
                    Invoice <strong>{$invoiceNumber}</strong> untuk paket <strong>{$planName}</strong> sebesar
                    <strong>Rp {$amount}</strong> akan jatuh tempo pada <strong>{$dueDate}</strong>.
                    Segera lakukan pembayaran agar layanan Anda tidak terhenti.
                </p>

                <div style='background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin:24px 0;text-align:center'>
                    <p style='font-size:14px;color:#92400e;margin:0'>Jika pembayaran tidak diterima hingga tanggal jatuh tempo, akses ke fitur platform akan dibatasi.</p>
                </div>

                <p style='font-size:13px;color:#9ca3af;text-align:center;margin-top:24px'>Email ini dikirim secara otomatis. Hubungi kami jika ada pertanyaan.</p>
            </div>
        </div>";
    }
}

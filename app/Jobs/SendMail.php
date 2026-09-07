<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Mail\Mailer;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendMail implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [10, 30, 60];

    public int $timeout = 300;

    public function __construct(public Mailable $mailable, public ?string $recipient = null) {}

    /**
     * The unique lock is based on the mailable class + recipient so the same
     * mail is never sent twice from a retried job.
     */
    public function uniqueId(): string
    {
        return get_class($this->mailable).':'.($this->recipient ?? $this->mailable->to[0]['address'] ?? 'unknown');
    }

    /**
     * Deliver the queued mailable through the default mailer.
     */
    public function handle(Mailer $mailer): void
    {
        if ($this->recipient !== null) {
            $this->mailable->to($this->recipient);
        }

        $mailer->send($this->mailable);
    }
}

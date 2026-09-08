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
use Illuminate\Support\Str;

class SendMail implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [10, 30, 60];

    public int $timeout = 300;

    /**
     * Keep the unique lock short: it guards against duplicate retries while a
     * mail is in flight, not against legitimately repeated mailings.
     */
    public int $uniqueFor = 300;

    public function __construct(public Mailable $mailable, public ?string $recipient = null) {}

    /**
     * The unique lock is based on the mailable class + recipient so the same
     * mail is never sent twice from a retried job.
     */
    public function uniqueId(): string
    {
        $recipient = $this->recipient ?? $this->mailable->to[0]['address'] ?? null;

        // Without a concrete recipient every anonymous mail would collide
        // under the unique lock, silently dropping valid jobs.
        if ($recipient === null) {
            return get_class($this->mailable).':'.Str::random(16);
        }

        return get_class($this->mailable).':'.$recipient;
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

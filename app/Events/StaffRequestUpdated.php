<?php

namespace App\Events;

use App\Models\Outlet;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StaffRequestUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  'accepted'|'rejected'  $result
     */
    public function __construct(public Outlet $outlet, public string $result) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('tenant.'.$this->outlet->company_id)];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $resultLabel = $this->result === 'accepted' ? 'diterima' : 'ditolak';

        return [
            'outlet_id' => $this->outlet->id,
            'outlet_name' => $this->outlet->nama_outlet,
            'result' => $this->result,
            'message' => "Permintaan staf untuk \"{$this->outlet->nama_outlet}\" telah {$resultLabel}.",
        ];
    }
}

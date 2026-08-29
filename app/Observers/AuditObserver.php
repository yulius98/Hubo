<?php

namespace App\Observers;

use App\Models\AuditLog;
use App\Services\AuditService;
use Illuminate\Database\Eloquent\Model;

class AuditObserver
{
    public function __construct(protected AuditService $audit) {}

    /**
     * Handle the "created" event.
     */
    public function created(Model $model): void
    {
        $this->audit->record(
            $model,
            AuditLog::EVENT_CREATED,
            new: $this->relevantAttributes($model),
        );
    }

    /**
     * Handle the "updated" event.
     */
    public function updated(Model $model): void
    {
        $this->audit->record(
            $model,
            AuditLog::EVENT_UPDATED,
            old: $model->getOriginal(),
            new: $model->getChanges(),
        );
    }

    /**
     * Handle the "deleted" event.
     */
    public function deleted(Model $model): void
    {
        $this->audit->record(
            $model,
            AuditLog::EVENT_DELETED,
        );
    }

    /**
     * Keep the default description when the model has no explicit one.
     */
    public function restored(Model $model): void
    {
        $this->audit->record(
            $model,
            AuditLog::EVENT_RESTORED,
        );
    }

    /**
     * @return array<string, mixed>|null
     */
    private function relevantAttributes(Model $model): ?array
    {
        return $model->getAttributes() ?: null;
    }
}

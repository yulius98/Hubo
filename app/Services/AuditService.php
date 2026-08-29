<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Contracts\Auth\Factory as Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use RuntimeException;

class AuditService
{
    public function __construct(
        protected Auth $auth,
        protected TenantService $tenants,
    ) {}

    /**
     * Record an audit entry for an authenticated action.
     *
     * @param  array<string, mixed>|null  $old
     * @param  array<string, mixed>|null  $new
     */
    public function record(
        Model $auditable,
        string $event,
        ?string $description = null,
        ?array $old = null,
        ?array $new = null,
    ): ?AuditLog {
        $user = $this->auth->user();

        if (! $user instanceof User) {
            return null;
        }

        $company = $this->tenants->current()
            ?? $this->tenants->resolveForUser($user);

        return AuditLog::create([
            'user_id' => $user->id,
            'company_id' => $company?->id,
            'outlet_id' => $this->resolveOutletId($user, $auditable),
            'event' => $event,
            'auditable_type' => $auditable->getMorphClass(),
            'auditable_id' => $auditable->getKey(),
            'description' => $description ?: $this->defaultDescription($event, $auditable),
            'old_values' => $this->enforceArray($old),
            'new_values' => $this->enforceArray($new),
            'ip_address' => request()->ip(),
            'user_agent' => Str::limit((string) request()->userAgent(), 255),
        ]);
    }

    /**
     * Record a free-form audit entry without a bound model.
     *
     * @param  array<string, mixed>|null  $new
     */
    public function log(
        string $event,
        string $description,
        ?Model $auditable = null,
        ?array $new = null,
    ): ?AuditLog {
        $user = $this->auth->user();

        if (! $user instanceof User) {
            return null;
        }

        $company = $this->tenants->current()
            ?? $this->tenants->resolveForUser($user);

        return AuditLog::create([
            'user_id' => $user->id,
            'company_id' => $company?->id,
            'outlet_id' => $this->resolveOutletId($user, $auditable),
            'event' => $event,
            'auditable_type' => $auditable?->getMorphClass() ?? 'system',
            'auditable_id' => $auditable?->getKey(),
            'description' => $description,
            'new_values' => $this->enforceArray($new),
            'ip_address' => request()->ip(),
            'user_agent' => Str::limit((string) request()->userAgent(), 255),
        ]);
    }

    /**
     * Resolve the outlet id for the auditable model, if it has one.
     */
    private function resolveOutletId(User $user, ?Model $auditable): ?int
    {
        if ($auditable === null) {
            return null;
        }

        if (array_key_exists('outlet_id', $auditable->getAttributes())) {
            return $auditable->getAttributes()['outlet_id'] ?? null;
        }

        if (method_exists($auditable, 'outlet')) {
            try {
                return $auditable->outlet()->first()?->id;
            } catch (RuntimeException) {
                return null;
            }
        }

        return null;
    }

    private function defaultDescription(string $event, Model $auditable): string
    {
        $label = Str::headline(class_basename($auditable));

        return match ($event) {
            AuditLog::EVENT_CREATED => "Membuat data {$label} baru",
            AuditLog::EVENT_UPDATED => "Memperbarui data {$label}",
            AuditLog::EVENT_DELETED => "Menghapus data {$label}",
            AuditLog::EVENT_RESTORED => "Memulihkan data {$label}",
            default => "Aksi pada {$label}",
        };
    }

    /**
     * @param  array<string, mixed>|null  $values
     * @return array<string, mixed>|null
     */
    private function enforceArray(?array $values): ?array
    {
        if ($values === null) {
            return null;
        }

        return collect($values)
            ->map(fn (mixed $value) => match (true) {
                is_scalar($value), is_null($value) => $value,
                is_object($value) && method_exists($value, '__toString') => (string) $value,
                default => json_encode($value),
            })
            ->all();
    }
}

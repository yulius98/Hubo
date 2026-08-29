<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    /**
     * List audit logs with filters.
     */
    public function index(Request $request): Response
    {
        $event = (string) $request->query('event', '');
        $search = (string) $request->query('search', '');

        $logs = AuditLog::query()
            ->with(['user:id,name,email'])
            ->when($event !== '', fn ($query) => $query->where('event', $event))
            ->when($search !== '', fn ($query) => $query
                ->where('description', 'like', "%{$search}%")
                ->orWhereHas('user', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                ->orWhere('auditable_type', 'like', "%{$search}%"))
            ->latest()
            ->limit(300)
            ->get()
            ->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'event' => $log->event,
                'description' => $log->description,
                'auditable_type' => class_basename($log->auditable_type),
                'auditable_id' => $log->auditable_id,
                'user' => $log->user?->name ?? 'Sistem',
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
            ])
            ->values();

        return Inertia::render('admin/audit-logs', [
            'logs' => $logs,
            'events' => [
                ['value' => 'created', 'label' => 'Dibuat'],
                ['value' => 'updated', 'label' => 'Diperbarui'],
                ['value' => 'deleted', 'label' => 'Dihapus'],
                ['value' => 'restored', 'label' => 'Dipulihkan'],
                ['value' => 'login', 'label' => 'Masuk'],
                ['value' => 'logout', 'label' => 'Keluar'],
                ['value' => 'action', 'label' => 'Aksi'],
            ],
            'filters' => ['event' => $event, 'search' => $search],
        ]);
    }
}

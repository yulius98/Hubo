<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrderReturn;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReturnController extends Controller
{
    public function index(Request $request): Response
    {
        $status = (string) $request->query('status', '');

        $returns = OrderReturn::query()
            ->with([
                'order:id,order_number,total,user_id',
                'order.user:id,name,email',
                'company:id,name',
            ])
            ->when(in_array($status, ['pending', 'approved', 'rejected', 'completed'], true), fn ($query) => $query
                ->where('status', $status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/returns', [
            'returns' => $returns,
            'filters' => [
                'status' => $status,
            ],
        ]);
    }
}

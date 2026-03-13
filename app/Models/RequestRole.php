<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class RequestRole extends Model
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'id_staff',
        'id_owner',
        'id_role',
        'id_outlet',
        'status'
    ];

    public function staff()
    {
        return $this->belongsTo(User::class, 'id_staff');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'id_owner');
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'id_role');
    }

    public function outlet()
    {
        return $this->belongsTo(Outlet::class, 'id_outlet');
    }
    
}

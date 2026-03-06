<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class Role extends Model
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'role'
    ];

    public function user()
    {
        return $this -> belongsToMany(User::class)
            ->withTimestamps();
    }

    public function requestRoles()
    {
        return $this->hasMany(RequestRole::class, 'id_role');
    }


}

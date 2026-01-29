<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'google_avatar_url',
        'avatar_url',
        'company_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Relations

    /**
     * Primary company (for backward compatibility with V1)
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * All companies the user belongs to
     */
    public function companies()
    {
        return $this->belongsToMany(Company::class, 'company_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Companies where user is admin
     */
    public function adminCompanies()
    {
        return $this->belongsToMany(Company::class, 'company_user')
            ->where('role', 'admin')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Check if user has role in a specific company
     */
    public function hasRoleInCompany(Company $company, string $role): bool
    {
        return $this->companies()
            ->where('company_id', $company->id)
            ->wherePivot('role', $role)
            ->exists();
    }

    /**
     * Check if user is admin of a company
     */
    public function isAdminOf(Company $company): bool
    {
        return $this->hasRoleInCompany($company, 'admin');
    }
}

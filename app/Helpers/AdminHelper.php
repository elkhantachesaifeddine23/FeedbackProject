<?php

namespace App\Helpers;

class AdminHelper
{
    /**
     * Email de l'administrateur de la plateforme
     */
    const ADMIN_EMAIL = 'saifdineelkhantache@gmail.com';

    /**
     * Liste des emails autorisés en tant qu'admin.
     */
    const ADMIN_EMAILS = [
        'saifdineelkhantache@gmail.com',
        'francois.bonnefoy34@gmail.com',
    ];

    /**
     * Check admin email using raw string (avoids loading the model).
     */
    public static function isAdminEmail(string $email): bool
    {
        $email = trim(strtolower($email));

        return in_array($email, array_map('strtolower', self::ADMIN_EMAILS), true);
    }

    /**
     * Vérifie si un utilisateur est l'administrateur
     *
     * @param \App\Models\User|null $user
     * @return bool
     */
    public static function isAdmin($user): bool
    {
        return $user && self::isAdminEmail($user->email);
    }
}

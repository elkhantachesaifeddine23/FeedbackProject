<?php

namespace App\Helpers;

class AdminHelper
{
    /**
     * Email de l'administrateur de la plateforme
     */
    const ADMIN_EMAIL = 'saifdineelkhantache@gmail.com';

    /**
     * Check admin email using raw string (avoids loading the model).
     */
    public static function isAdminEmail(string $email): bool
    {
        return trim(strtolower($email)) === strtolower(self::ADMIN_EMAIL);
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

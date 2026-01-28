<?php

namespace App\Http\Controllers;

use App\Helpers\AdminHelper;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class Admin2FAController extends Controller
{
	public function show(Request $request): Response|RedirectResponse
	{
		$pending = $request->session()->get('admin_2fa_pending');

		if (! $pending || ! AdminHelper::isAdminEmail($pending['email'] ?? '')) {
			return redirect()->route('login');
		}

		return Inertia::render('Admin/Admin2FA', [
			'status' => session('status'),
			'email' => $pending['email'],
			'expiresInSeconds' => 30,
		]);
	}

	public function verify(Request $request): RedirectResponse
	{
		$pending = $request->session()->get('admin_2fa_pending');

		if (! $pending || ! AdminHelper::isAdminEmail($pending['email'] ?? '')) {
			return redirect()->route('login');
		}

		$request->validate([
			'code' => ['required', 'digits:6'],
		]);

		$cacheKey = $this->twoFactorCacheKey($pending['email']);
		$cached = Cache::get($cacheKey);

		if (! $cached || ! isset($cached['hash']) || ! Hash::check($request->input('code'), $cached['hash'])) {
			return back()->withErrors([
				'code' => 'Code invalide ou expiré.',
			]);
		}

		$user = User::where('email', $pending['email'])->first();

		if (! $user) {
			Cache::forget($cacheKey);
			$request->session()->forget('admin_2fa_pending');

			return redirect()->route('login')->withErrors([
				'email' => 'Compte administrateur introuvable.',
			]);
		}

		Cache::forget($cacheKey);
		$request->session()->forget('admin_2fa_pending');

		Auth::login($user, $pending['remember'] ?? false);
		$request->session()->regenerate();	
	// Marquer que 2FA est passé (au cas où middleware Admin2FA est utilisé)
	$request->session()->put('two_factor_passed', true);
		return redirect()->intended(route('admin.dashboard', absolute: false));
	}

	private function twoFactorCacheKey(string $email): string
	{
		return 'admin_2fa_code_'.md5(strtolower($email));
	}
}

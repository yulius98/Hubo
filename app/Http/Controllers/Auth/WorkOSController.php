<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\WorkOS\Http\Requests\AuthKitAuthenticationRequest;
use Laravel\WorkOS\Http\Requests\AuthKitLoginRequest;
use Laravel\WorkOS\Http\Requests\AuthKitLogoutRequest;

class WorkOSController extends Controller
{
    public function login(AuthKitLoginRequest $request)
    {
        return $request->redirect();
    }

    public function authenticate(AuthKitAuthenticationRequest $request)
    {
        try {
            $request->authenticate(
                createUsing: function ($user) {
                    Log::info('Creating/updating user from WorkOS', ['email' => $user->email]);

                    // Check if user exists by email and update their workos_id, or create new user
                    return User::updateOrCreate(
                        ['email' => $user->email], // Search by email
                        [
                            'name' => $user->firstName . ' ' . $user->lastName,
                            'email_verified_at' => now(),
                            'avatar' => $user->avatar,
                            'workos_id' => $user->id,
                            'password' => null, // WorkOS manages passwords, not local DB
                        ]
                    );
                },
                updateUsing: function ($existingUser, $user) {
                    Log::info('Updating existing user from WorkOS', ['email' => $user->email]);

                    // Update user data from WorkOS to keep it synchronized
                    $existingUser->update([
                        'name' => $user->firstName . ' ' . $user->lastName,
                        'email' => $user->email,
                        'email_verified_at' => now(),
                        'avatar' => $user->avatar ?? $existingUser->avatar,
                        'password' => null, // WorkOS manages passwords, not local DB
                    ]);

                    return $existingUser;
                }
            );

            Log::info('User authenticated successfully', ['user_id' => Auth::id()]);

            // Regenerate session to prevent fixation attacks and ensure clean session
            $request->session()->regenerate();

            return redirect()->intended(route('homepage'));

        } catch (\Exception $e) {
            Log::error('WorkOS authentication failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->route('login')->with('error', 'Authentication failed. Please try again.');
        }
    }

    protected function redirectBasedOnRole()
    {
        $user = Auth::user();

        // $roleName = $user->role->role ?? null;

        // if ($roleName === 'user') {
        //     return redirect()->route('Homepage');
        // }

        return redirect()->route('homepage');
    }

    public function logout(AuthKitLogoutRequest $request)
    {
        return $request->logout();
    }
}

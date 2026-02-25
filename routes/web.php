<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use Inertia\Inertia;

use App\Http\Controllers\{
    CompanyController,
    DashboardController,
    CustomerController,
    FeedbackController,
    FeedbackDesignController,
    FeedbackRequestController,
    ProfileController,
    FeedbackReplyController,
    ReviewPlatformController,
    SettingsController,
    TaskController,
    HealthController,
    BrevoTestController
};
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\AdminRadarController;
use App\Http\Middleware\IsAdmin;
use App\Services\SmsService;

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/

// Health checks (for load balancers and monitoring)
Route::get('/health', [HealthController::class, 'index'])->name('health');
Route::get('/health/detailed', [HealthController::class, 'detailed'])->name('health.detailed');

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'       => Route::has('login'),
        'canRegister'    => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion'     => PHP_VERSION,
    ]);
});

/*
|--------------------------------------------------------------------------
| Feedback public (clients)
|--------------------------------------------------------------------------
*/

Route::get('/feedback', [FeedbackController::class, 'showPublic'])
    ->name('feedback.public');

Route::post('/feedback', [FeedbackController::class, 'storePublic'])
    ->name('feedback.storePublic');

Route::get('/feedback/{token}', [FeedbackController::class, 'show'])
    ->name('feedback.show');

Route::post('/feedback/{token}', [FeedbackController::class, 'store'])
    ->name('feedback.store');

// QR Code generation (needs auth but with special handling for img tags)
Route::get('/customers/{customer}/qr', [CustomerController::class, 'qrCode'])
    ->middleware(['auth'])
    ->name('customers.qr');

Route::get('/feedback-requests/{feedbackRequest}/qr', [FeedbackRequestController::class, 'qrCode'])
    ->middleware(['auth'])
    ->name('feedback-requests.qr');

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/analytics', [DashboardController::class, 'analytics'])
        ->name('analytics.index');

    // Liste de tous les feedbacks
    Route::get('/feedbacks', [FeedbackController::class, 'index'])
        ->name('feedbacks.index');

    Route::get('/feedbacks/{id}', [FeedbackController::class, 'adminShow'])
        ->name('feedback.adminShow');

    // Suppression d'un feedback
    Route::delete('/feedbacks/{id}', [FeedbackController::class, 'destroy'])
        ->name('feedbacks.destroy');

    // Épingler/Désépingler un feedback
    Route::post('/feedbacks/{id}/toggle-pin', [FeedbackController::class, 'togglePin'])
        ->name('feedbacks.togglePin');

    // Configuration du design de la page feedback
    Route::get('/feedback-design', [FeedbackDesignController::class, 'edit'])
        ->name('feedback.design.edit');
    
    Route::post('/feedback-design', [FeedbackDesignController::class, 'update'])
        ->name('feedback.design.update');

    // Liste des réponses pour un feedback
    Route::get('/feedback/{id}/replies', [FeedbackReplyController::class, 'index'])
        ->name('feedback.replies.index');

    // Création d'une réponse manuelle
    Route::post('/feedback/{id}/replies', [FeedbackReplyController::class, 'store'])
        ->name('feedback.replies.store');

    // Génération IA d'une réponse
    Route::post('/feedback/{id}/replies/ai', [FeedbackReplyController::class, 'generateAIReply'])
        ->name('feedback.replies.ai');

    // Génération IA synchrone (retourne le contenu généré en JSON)
    Route::post('/feedback/{id}/replies/ai/generate', [FeedbackReplyController::class, 'generateAIReplySync'])
        ->name('feedback.replies.ai.generate');

    /*
    | Dashboard
    */
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    Route::get('/radar-ia', [DashboardController::class, 'radar'])
        ->name('radar');
    Route::get('/radar-ia/export', [DashboardController::class, 'exportRadar'])
        ->name('radar.export');

    /*
    | Tasks (company)
    */
    Route::get('/tasks', [TaskController::class, 'index'])
        ->name('tasks.index');
    Route::post('/tasks', [TaskController::class, 'store'])
        ->name('tasks.store');
    Route::patch('/tasks/{task}/status', [TaskController::class, 'updateStatus'])
        ->name('tasks.updateStatus');

    /*
    | Profile
    */
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    /*
    | Customers
    */
    Route::get('/customers', [CustomerController::class, 'index'])
        ->name('customers.index');

    Route::get('/customers/create', [CustomerController::class, 'create'])
        ->name('customers.create');

    Route::post('/customers', [CustomerController::class, 'store'])
        ->name('customers.store');
    
    Route::get('/customers/{customer}/edit', [CustomerController::class, 'edit'])
        ->name('customers.edit');
    
    Route::put('/customers/{customer}', [CustomerController::class, 'update'])
        ->name('customers.update');
    
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])
    ->name('customers.destroy');


    Route::post('/customers/import-csv', [CustomerController::class, 'importCSV'])
        ->name('customers.importCSV');

    Route::get('/company/settings', [CompanyController::class, 'edit'])
        ->name('company.edit');

    Route::put('/company/settings', [CompanyController::class, 'update'])
        ->name('company.update');

    /*
    | Review Platforms
    */
    Route::get('/review-platforms', [ReviewPlatformController::class, 'index'])
        ->name('review-platforms.index');
    
    Route::post('/review-platforms', [ReviewPlatformController::class, 'upsert'])
        ->name('review-platforms.upsert');

    /*
    | Settings
    */
    Route::get('/settings', [SettingsController::class, 'index'])
        ->name('settings.index');
    
    Route::patch('/settings/profile', [SettingsController::class, 'updateProfile'])
        ->name('settings.profile.update');
    
    Route::patch('/settings/password', [SettingsController::class, 'updatePassword'])
        ->name('settings.password.update');
    
    Route::delete('/settings/account', [SettingsController::class, 'destroy'])
        ->name('settings.account.destroy');

    /*
    | Feedback requests (send / resend)
    */
    Route::post('/feedback-requests', [FeedbackRequestController::class, 'store'])
        ->name('feedback-requests.store');
    
    Route::post('/feedback-requests/bulk', [FeedbackRequestController::class, 'storeBulk'])
        ->name('feedback-requests.bulk');

    /*
    | Brevo diagnostics
    */
    Route::prefix('test-brevo')->group(function () {
        Route::get('/config', [BrevoTestController::class, 'config'])
            ->name('brevo.config');
        Route::get('/account', [BrevoTestController::class, 'account'])
            ->name('brevo.account');
        Route::get('/sms-credits', [BrevoTestController::class, 'smsCredits'])
            ->name('brevo.smsCredits');
        Route::get('/email', [BrevoTestController::class, 'testEmail'])
            ->name('brevo.email');
        Route::get('/sms', [BrevoTestController::class, 'testSms'])
            ->name('brevo.sms');
        Route::get('/reminder', [BrevoTestController::class, 'testReminder'])
            ->name('brevo.reminder');
    });
});

/*
||--------------------------------------------------------------------------
|| Admin routes (créateurs de la plateforme)
||--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', IsAdmin::class])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])
        ->name('dashboard');

    Route::get('/radar-ia', [AdminRadarController::class, 'index'])
        ->name('radar');
    Route::post('/radar-ia/regenerate', [AdminRadarController::class, 'regenerate'])
        ->name('radar.regenerate');

    // Admin sections
    Route::get('/companies', [AdminController::class, 'companies'])
        ->name('companies');
    Route::get('/users', [AdminController::class, 'users'])
        ->name('users');
    Route::get('/feedbacks', [AdminController::class, 'feedbacks'])
        ->name('feedbacks');
    Route::get('/requests', [AdminController::class, 'requests'])
        ->name('requests');
    Route::get('/replies', [AdminController::class, 'replies'])
        ->name('replies');
    Route::get('/analytics', [AdminController::class, 'analytics'])
        ->name('analytics');
    Route::get('/subscriptions', [AdminController::class, 'subscriptions'])
        ->name('subscriptions');
    Route::get('/channels', [AdminController::class, 'channels'])
        ->name('channels');
    Route::get('/settings', [AdminController::class, 'settings'])
        ->name('settings');
});




require __DIR__.'/auth.php';

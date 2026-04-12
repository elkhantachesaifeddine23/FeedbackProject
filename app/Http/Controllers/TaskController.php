<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TaskController extends Controller
{
    private const IMPORTANCE_MAP = [
        'high' => Task::SEVERITY_CRITICAL,
        'medium' => Task::SEVERITY_MODERATE,
        'low' => Task::SEVERITY_LOW,
    ];

    public function index()
    {
        $company = Auth::user()->company;

        if (! $company) {
            abort(403);
        }

        // Show gate page when feature not available
        if (!$company->hasFeature('tasks')) {
            return \Inertia\Inertia::render('Tasks/Index', [
                'hasAccess'       => false,
                'tasks'           => [],
                'statusOptions'   => [],
                'importanceOptions' => [],
            ]);
        }

        $tasks = Task::where('company_id', $company->id)
            ->latest()
            ->get()
            ->map(function (Task $task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'status' => $task->status,
                    'status_label' => $task->status_label,
                    'severity' => $task->severity,
                    'importance' => $this->severityToImportance($task->severity),
                    'created_at' => optional($task->created_at)->format('Y-m-d H:i'),
                ];
            });

        return Inertia::render('Tasks/Index', [
            'hasAccess' => true,
            'tasks' => $tasks,
            'statusOptions' => [
                ['value' => Task::STATUS_NOT_STARTED, 'label' => 'À faire'],
                ['value' => Task::STATUS_IN_PROGRESS, 'label' => 'En cours'],
                ['value' => Task::STATUS_COMPLETED, 'label' => 'Terminé'],
            ],
            'importanceOptions' => [
                ['value' => 'high', 'label' => 'High'],
                ['value' => 'medium', 'label' => 'Medium'],
                ['value' => 'low', 'label' => 'Low'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $company = Auth::user()->company;

        if (! $company) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'status' => ['nullable', 'in:not_started,in_progress,completed'],
            'importance' => ['nullable', 'in:high,medium,low'],
        ]);

        Task::create([
            'company_id' => $company->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? Task::STATUS_NOT_STARTED,
            'severity' => $this->importanceToSeverity($validated['importance'] ?? 'medium'),
        ]);

        return back();
    }

    public function updateStatus(Request $request, Task $task)
    {
        $company = Auth::user()->company;

        if (! $company || $task->company_id !== $company->id) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => ['required', 'in:not_started,in_progress,completed'],
        ]);

        $task->update([
            'status' => $validated['status'],
        ]);

        return back();
    }

    private function importanceToSeverity(string $importance): string
    {
        return self::IMPORTANCE_MAP[$importance] ?? Task::SEVERITY_MODERATE;
    }

    private function severityToImportance(?string $severity): string
    {
        $reverse = array_flip(self::IMPORTANCE_MAP);
        return $reverse[$severity] ?? 'medium';
    }
}

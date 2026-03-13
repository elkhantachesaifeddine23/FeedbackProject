<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\DetectedProblem;
use App\Models\Feedback;
use App\Models\FeedbackRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DetectedProblemsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['email_verified_at' => now()]);
        $this->company = Company::factory()->create(['user_id' => $this->user->id]);
    }

    /**
     * Helper: create a feedback linked to this company
     */
    private function createFeedback(array $attrs = []): Feedback
    {
        $customer = Customer::factory()->create(['company_id' => $this->company->id]);
        $request = FeedbackRequest::factory()->create([
            'company_id' => $this->company->id,
            'customer_id' => $customer->id,
        ]);

        return Feedback::factory()->create(array_merge([
            'feedback_request_id' => $request->id,
        ], $attrs));
    }

    // ═══════════════════════════════════════════════════════════
    // 1. MODEL: DetectedProblem — Creation, Relations, Accessors
    // ═══════════════════════════════════════════════════════════

    public function test_detected_problem_can_be_created(): void
    {
        $problem = DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'Service lent au déjeuner',
            'detail' => 'Plusieurs clients se plaignent de la lenteur.',
            'solution' => 'Embaucher un serveur supplémentaire.',
            'effort' => 'moyen',
            'impact' => 'fort',
            'urgency' => 'immédiat',
            'status' => DetectedProblem::STATUS_OPEN,
            'type' => DetectedProblem::TYPE_PROBLEM,
            'ai_hash' => DetectedProblem::generateHash('Service lent au déjeuner', $this->company->id),
        ]);

        $this->assertDatabaseHas('detected_problems', [
            'id' => $problem->id,
            'title' => 'Service lent au déjeuner',
            'status' => 'open',
            'type' => 'problem',
        ]);
    }

    public function test_detected_problem_belongs_to_company(): void
    {
        $problem = DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'Test relation',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_OPEN,
            'ai_hash' => DetectedProblem::generateHash('Test relation', $this->company->id),
        ]);

        $this->assertEquals($this->company->id, $problem->company->id);
    }

    public function test_detected_problem_has_many_feedbacks_via_pivot(): void
    {
        $problem = DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'Problème lié aux feedbacks',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_OPEN,
            'ai_hash' => DetectedProblem::generateHash('Problème lié aux feedbacks', $this->company->id),
        ]);

        $fb1 = $this->createFeedback(['rating' => 1, 'comment' => 'Mauvais service']);
        $fb2 = $this->createFeedback(['rating' => 2, 'comment' => 'Lent']);

        $problem->feedbacks()->attach([$fb1->id, $fb2->id]);

        $this->assertCount(2, $problem->fresh()->feedbacks);
    }

    public function test_feedback_belongs_to_many_detected_problems(): void
    {
        $fb = $this->createFeedback(['rating' => 1, 'comment' => 'Mauvais']);

        $p1 = DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'Problème 1',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_OPEN,
            'ai_hash' => DetectedProblem::generateHash('Problème 1', $this->company->id),
        ]);
        $p2 = DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'Problème 2',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_OPEN,
            'ai_hash' => DetectedProblem::generateHash('Problème 2', $this->company->id),
        ]);

        $fb->detectedProblems()->attach([$p1->id, $p2->id]);

        $this->assertCount(2, $fb->fresh()->detectedProblems);
    }

    public function test_nullable_fields_allow_creation_without_urgency(): void
    {
        $problem = DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'Problème sans urgency',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_OPEN,
            'ai_hash' => DetectedProblem::generateHash('Problème sans urgency', $this->company->id),
            // urgency, effort, impact, solution, detail are ALL null
        ]);

        $this->assertDatabaseHas('detected_problems', ['id' => $problem->id]);
        $this->assertNull($problem->urgency);
        $this->assertNull($problem->effort);
        $this->assertNull($problem->impact);
    }

    // ═══════════════════════════════════════════════════════════
    // 2. MODEL: Scopes
    // ═══════════════════════════════════════════════════════════

    public function test_scope_open(): void
    {
        DetectedProblem::create(['company_id' => $this->company->id, 'title' => 'Open', 'status' => 'open', 'type' => 'problem', 'ai_hash' => 'h1']);
        DetectedProblem::create(['company_id' => $this->company->id, 'title' => 'Resolved', 'status' => 'resolved', 'type' => 'problem', 'ai_hash' => 'h2']);

        $this->assertCount(1, DetectedProblem::open()->get());
    }

    public function test_scope_not_resolved(): void
    {
        DetectedProblem::create(['company_id' => $this->company->id, 'title' => 'Open', 'status' => 'open', 'type' => 'problem', 'ai_hash' => 'h1']);
        DetectedProblem::create(['company_id' => $this->company->id, 'title' => 'InProg', 'status' => 'in_progress', 'type' => 'problem', 'ai_hash' => 'h2']);
        DetectedProblem::create(['company_id' => $this->company->id, 'title' => 'Resolved', 'status' => 'resolved', 'type' => 'problem', 'ai_hash' => 'h3']);

        $this->assertCount(2, DetectedProblem::notResolved()->get());
    }

    public function test_scope_problems_vs_decisions(): void
    {
        DetectedProblem::create(['company_id' => $this->company->id, 'title' => 'Prob', 'status' => 'open', 'type' => 'problem', 'ai_hash' => 'h1']);
        DetectedProblem::create(['company_id' => $this->company->id, 'title' => 'Dec', 'status' => 'open', 'type' => 'decision', 'ai_hash' => 'h2']);

        $this->assertCount(1, DetectedProblem::problems()->get());
        $this->assertCount(1, DetectedProblem::decisions()->get());
    }

    // ═══════════════════════════════════════════════════════════
    // 3. MODEL: Actions — markResolved, reopen
    // ═══════════════════════════════════════════════════════════

    public function test_mark_resolved_sets_status_and_timestamp(): void
    {
        $problem = DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'À résoudre',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_OPEN,
            'ai_hash' => 'test-hash-1',
        ]);

        $problem->markResolved();
        $problem->refresh();

        $this->assertEquals(DetectedProblem::STATUS_RESOLVED, $problem->status);
        $this->assertNotNull($problem->resolved_at);
        $this->assertTrue($problem->is_resolved);
    }

    public function test_mark_resolved_cascades_to_linked_feedbacks(): void
    {
        $problem = DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'Cascade test',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_OPEN,
            'ai_hash' => 'cascade-hash',
        ]);

        $fb1 = $this->createFeedback(['rating' => 1, 'comment' => 'Bad']);
        $fb2 = $this->createFeedback(['rating' => 2, 'comment' => 'Also bad']);
        $fb3 = $this->createFeedback(['rating' => 1, 'comment' => 'Already resolved', 'resolved_at' => now()->subDay()]);

        $problem->feedbacks()->attach([$fb1->id, $fb2->id, $fb3->id]);

        $problem->markResolved();

        // Unresolved feedbacks should now be resolved
        $this->assertNotNull($fb1->fresh()->resolved_at);
        $this->assertNotNull($fb2->fresh()->resolved_at);
        $this->assertStringContainsString('Résolu via Radar IA', $fb1->fresh()->resolution_note);

        // Already-resolved feedback should keep its original resolved_at
        $this->assertTrue($fb3->fresh()->resolved_at->lt(now()->subHours(23)));
    }

    public function test_mark_resolved_without_cascade(): void
    {
        $problem = DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'No cascade',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_OPEN,
            'ai_hash' => 'no-cascade-hash',
        ]);

        $fb = $this->createFeedback(['rating' => 1]);
        $problem->feedbacks()->attach($fb->id);

        $problem->markResolved(cascadeToFeedbacks: false);

        $this->assertEquals(DetectedProblem::STATUS_RESOLVED, $problem->fresh()->status);
        $this->assertNull($fb->fresh()->resolved_at); // Not cascaded
    }

    public function test_reopen_clears_status_and_timestamp(): void
    {
        $problem = DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'Was resolved',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_RESOLVED,
            'resolved_at' => now(),
            'ai_hash' => 'reopen-hash',
        ]);

        $problem->reopen();
        $problem->refresh();

        $this->assertEquals(DetectedProblem::STATUS_OPEN, $problem->status);
        $this->assertNull($problem->resolved_at);
        $this->assertFalse($problem->is_resolved);
    }

    // ═══════════════════════════════════════════════════════════
    // 4. MODEL: Hash generation & deduplication
    // ═══════════════════════════════════════════════════════════

    public function test_generate_hash_is_deterministic(): void
    {
        $h1 = DetectedProblem::generateHash('Service lent', 1);
        $h2 = DetectedProblem::generateHash('Service lent', 1);
        $this->assertEquals($h1, $h2);
    }

    public function test_generate_hash_is_case_insensitive(): void
    {
        $h1 = DetectedProblem::generateHash('Service Lent', 1);
        $h2 = DetectedProblem::generateHash('service lent', 1);
        $this->assertEquals($h1, $h2);
    }

    public function test_generate_hash_is_trim_safe(): void
    {
        $h1 = DetectedProblem::generateHash('  Service lent  ', 1);
        $h2 = DetectedProblem::generateHash('Service lent', 1);
        $this->assertEquals($h1, $h2);
    }

    public function test_generate_hash_differs_across_companies(): void
    {
        $h1 = DetectedProblem::generateHash('Service lent', 1);
        $h2 = DetectedProblem::generateHash('Service lent', 2);
        $this->assertNotEquals($h1, $h2);
    }

    public function test_generate_hash_differs_for_different_titles(): void
    {
        $h1 = DetectedProblem::generateHash('Service lent', 1);
        $h2 = DetectedProblem::generateHash('Nourriture froide', 1);
        $this->assertNotEquals($h1, $h2);
    }

    // ═══════════════════════════════════════════════════════════
    // 5. ACCESSORS: is_resolved, status_label
    // ═══════════════════════════════════════════════════════════

    public function test_is_resolved_accessor(): void
    {
        $open = DetectedProblem::create(['company_id' => $this->company->id, 'title' => 'O', 'status' => 'open', 'type' => 'problem', 'ai_hash' => 'a1']);
        $resolved = DetectedProblem::create(['company_id' => $this->company->id, 'title' => 'R', 'status' => 'resolved', 'type' => 'problem', 'ai_hash' => 'a2']);

        $this->assertFalse($open->is_resolved);
        $this->assertTrue($resolved->is_resolved);
    }

    public function test_status_label_accessor(): void
    {
        $open = DetectedProblem::create(['company_id' => $this->company->id, 'title' => 'O', 'status' => 'open', 'type' => 'problem', 'ai_hash' => 'b1']);
        $inProg = DetectedProblem::create(['company_id' => $this->company->id, 'title' => 'I', 'status' => 'in_progress', 'type' => 'problem', 'ai_hash' => 'b2']);
        $resolved = DetectedProblem::create(['company_id' => $this->company->id, 'title' => 'R', 'status' => 'resolved', 'type' => 'problem', 'ai_hash' => 'b3']);

        $this->assertEquals('Ouvert', $open->status_label);
        $this->assertEquals('En cours', $inProg->status_label);
        $this->assertEquals('Résolu', $resolved->status_label);
    }

    // ═══════════════════════════════════════════════════════════
    // 6. SYNC: syncDetectedProblems logic
    // ═══════════════════════════════════════════════════════════

    public function test_sync_creates_new_problems_from_ai_summary(): void
    {
        $fb = $this->createFeedback(['rating' => 1, 'comment' => 'Mauvais service']);

        $feedbackSummary = [
            'status' => 'ok',
            'summary' => 'Test summary',
            'problems' => [
                [
                    'title' => 'Service client lent',
                    'detail' => 'Les clients attendent trop longtemps.',
                    'solution' => 'Recruter plus de personnel.',
                    'effort' => 'moyen',
                    'impact' => 'fort',
                    'feedback_ids' => [$fb->id],
                ],
            ],
            'decisions' => [
                [
                    'title' => 'Former le personnel',
                    'detail' => 'Formation urgente nécessaire.',
                    'impact' => 'fort',
                    'urgency' => 'immédiat',
                    'feedback_ids' => [$fb->id],
                ],
            ],
        ];

        $this->callSync($feedbackSummary, [['id' => $fb->id, 'rating' => 1, 'comment' => 'Mauvais service']]);

        // Problem created
        $this->assertDatabaseHas('detected_problems', [
            'company_id' => $this->company->id,
            'title' => 'Service client lent',
            'type' => 'problem',
            'status' => 'open',
        ]);

        // Decision created
        $this->assertDatabaseHas('detected_problems', [
            'company_id' => $this->company->id,
            'title' => 'Former le personnel',
            'type' => 'decision',
            'status' => 'open',
        ]);

        // Pivot created
        $problem = DetectedProblem::where('title', 'Service client lent')->first();
        $this->assertTrue($problem->feedbacks->contains($fb->id));
    }

    public function test_sync_deduplicates_by_hash(): void
    {
        $fb = $this->createFeedback(['rating' => 2, 'comment' => 'Lent']);

        $feedbackSummary = [
            'status' => 'ok',
            'summary' => 'Test',
            'problems' => [
                ['title' => 'Service lent', 'detail' => 'V1', 'solution' => 'S1', 'effort' => 'faible', 'impact' => 'moyen', 'feedback_ids' => [$fb->id]],
            ],
            'decisions' => [],
        ];

        $payload = [['id' => $fb->id, 'rating' => 2, 'comment' => 'Lent']];

        // Call sync twice
        $this->callSync($feedbackSummary, $payload);
        $this->callSync($feedbackSummary, $payload);

        // Should still be only 1 record (same hash)
        $this->assertEquals(1, DetectedProblem::where('company_id', $this->company->id)->count());
    }

    public function test_sync_updates_existing_problem_content(): void
    {
        $fb = $this->createFeedback(['rating' => 1]);

        // First sync
        $this->callSync([
            'status' => 'ok', 'summary' => '', 'decisions' => [],
            'problems' => [['title' => 'Problème X', 'detail' => 'Détail v1', 'solution' => 'S1', 'impact' => 'faible', 'feedback_ids' => [$fb->id]]],
        ], [['id' => $fb->id, 'rating' => 1, 'comment' => 'x']]);

        // Second sync with updated content
        $this->callSync([
            'status' => 'ok', 'summary' => '', 'decisions' => [],
            'problems' => [['title' => 'Problème X', 'detail' => 'Détail v2', 'solution' => 'S2', 'impact' => 'fort', 'feedback_ids' => [$fb->id]]],
        ], [['id' => $fb->id, 'rating' => 1, 'comment' => 'x']]);

        $problem = DetectedProblem::where('company_id', $this->company->id)->first();
        $this->assertEquals('Détail v2', $problem->detail);
        $this->assertEquals('fort', $problem->impact);
    }

    public function test_sync_preserves_in_progress_status(): void
    {
        // Manually create an in_progress problem
        $hash = DetectedProblem::generateHash('Problème manuel', $this->company->id);
        DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'Problème manuel',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_IN_PROGRESS,
            'ai_hash' => $hash,
        ]);

        $fb = $this->createFeedback(['rating' => 1]);

        // Sync with same problem title → should NOT reset to open
        $this->callSync([
            'status' => 'ok', 'summary' => '', 'decisions' => [],
            'problems' => [['title' => 'Problème manuel', 'detail' => 'Updated', 'feedback_ids' => [$fb->id]]],
        ], [['id' => $fb->id, 'rating' => 1, 'comment' => 'x']]);

        $problem = DetectedProblem::where('ai_hash', $hash)->first();
        $this->assertEquals(DetectedProblem::STATUS_IN_PROGRESS, $problem->status);
        $this->assertEquals('Updated', $problem->detail);
    }

    public function test_sync_auto_resolves_stale_open_problems(): void
    {
        // Pre-existing open problem that IA no longer detects
        DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'Ancien problème',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_OPEN,
            'ai_hash' => DetectedProblem::generateHash('Ancien problème', $this->company->id),
        ]);

        $fb = $this->createFeedback(['rating' => 3]);

        // Sync with a DIFFERENT problem → old one should auto-resolve
        $this->callSync([
            'status' => 'ok', 'summary' => '', 'decisions' => [],
            'problems' => [['title' => 'Nouveau problème', 'detail' => 'N', 'feedback_ids' => [$fb->id]]],
        ], [['id' => $fb->id, 'rating' => 3, 'comment' => 'x']]);

        $old = DetectedProblem::where('title', 'Ancien problème')->first();
        $this->assertEquals(DetectedProblem::STATUS_RESOLVED, $old->status);
        $this->assertNotNull($old->resolved_at);
    }

    public function test_sync_does_not_auto_resolve_in_progress(): void
    {
        // In-progress problem that IA no longer detects → should NOT auto-resolve
        DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'En cours de traitement',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_IN_PROGRESS,
            'ai_hash' => DetectedProblem::generateHash('En cours de traitement', $this->company->id),
        ]);

        $fb = $this->createFeedback(['rating' => 4]);

        $this->callSync([
            'status' => 'ok', 'summary' => '', 'decisions' => [],
            'problems' => [['title' => 'Autre chose', 'detail' => 'N', 'feedback_ids' => [$fb->id]]],
        ], [['id' => $fb->id, 'rating' => 4, 'comment' => 'x']]);

        $inProgress = DetectedProblem::where('title', 'En cours de traitement')->first();
        $this->assertEquals(DetectedProblem::STATUS_IN_PROGRESS, $inProgress->status);
    }

    public function test_sync_reopens_resolved_problem_if_re_detected(): void
    {
        $hash = DetectedProblem::generateHash('Problème récurrent', $this->company->id);
        DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'Problème récurrent',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_RESOLVED,
            'resolved_at' => now()->subDay(),
            'ai_hash' => $hash,
        ]);

        $fb = $this->createFeedback(['rating' => 1]);

        $this->callSync([
            'status' => 'ok', 'summary' => '', 'decisions' => [],
            'problems' => [['title' => 'Problème récurrent', 'detail' => 'Il est revenu', 'feedback_ids' => [$fb->id]]],
        ], [['id' => $fb->id, 'rating' => 1, 'comment' => 'x']]);

        $problem = DetectedProblem::where('ai_hash', $hash)->first();
        $this->assertEquals(DetectedProblem::STATUS_OPEN, $problem->status);
        $this->assertNull($problem->resolved_at);
    }

    public function test_sync_skips_when_status_is_empty(): void
    {
        $this->callSync(['status' => 'empty', 'summary' => '', 'problems' => [], 'decisions' => []], []);

        $this->assertEquals(0, DetectedProblem::count());
    }

    public function test_sync_ignores_invalid_feedback_ids(): void
    {
        $fb = $this->createFeedback(['rating' => 1]);

        $this->callSync([
            'status' => 'ok', 'summary' => '', 'decisions' => [],
            'problems' => [['title' => 'Test IDs', 'detail' => 'D', 'feedback_ids' => [$fb->id, 99999, 88888]]],
        ], [['id' => $fb->id, 'rating' => 1, 'comment' => 'x']]);

        $problem = DetectedProblem::where('title', 'Test IDs')->first();
        // Only the valid ID should be attached
        $this->assertEquals(1, $problem->feedbacks()->count());
        $this->assertTrue($problem->feedbacks->contains($fb->id));
    }

    public function test_sync_accumulates_feedback_links(): void
    {
        $fb1 = $this->createFeedback(['rating' => 1, 'comment' => 'Bad']);
        $fb2 = $this->createFeedback(['rating' => 2, 'comment' => 'Also bad']);

        // First sync with fb1
        $this->callSync([
            'status' => 'ok', 'summary' => '', 'decisions' => [],
            'problems' => [['title' => 'Accumul', 'detail' => 'D', 'feedback_ids' => [$fb1->id]]],
        ], [['id' => $fb1->id, 'rating' => 1, 'comment' => 'Bad']]);

        // Second sync with fb2 (same problem)
        $this->callSync([
            'status' => 'ok', 'summary' => '', 'decisions' => [],
            'problems' => [['title' => 'Accumul', 'detail' => 'D', 'feedback_ids' => [$fb2->id]]],
        ], [['id' => $fb2->id, 'rating' => 2, 'comment' => 'Also bad']]);

        $problem = DetectedProblem::where('title', 'Accumul')->first();
        // Both feedbacks should be linked (syncWithoutDetaching)
        $this->assertEquals(2, $problem->feedbacks()->count());
    }

    // ═══════════════════════════════════════════════════════════
    // 7. CONTROLLER: Resolve endpoint
    // ═══════════════════════════════════════════════════════════

    public function test_resolve_endpoint_marks_problem_resolved(): void
    {
        $problem = DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'To resolve via API',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_OPEN,
            'ai_hash' => 'api-resolve-hash',
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('radar.problems.resolve', ['id' => $problem->id]));

        $response->assertRedirect();
        $this->assertEquals(DetectedProblem::STATUS_RESOLVED, $problem->fresh()->status);
    }

    public function test_resolve_endpoint_cascades_feedbacks(): void
    {
        $problem = DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'Resolve with cascade',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_OPEN,
            'ai_hash' => 'cascade-endpoint',
        ]);

        $fb = $this->createFeedback(['rating' => 1, 'comment' => 'Bad']);
        $problem->feedbacks()->attach($fb->id);

        $this->actingAs($this->user)
            ->post(route('radar.problems.resolve', ['id' => $problem->id]));

        $this->assertNotNull($fb->fresh()->resolved_at);
    }

    public function test_resolve_rejects_already_resolved(): void
    {
        $problem = DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'Already resolved',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_RESOLVED,
            'resolved_at' => now(),
            'ai_hash' => 'already-resolved',
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('radar.problems.resolve', ['id' => $problem->id]));

        $response->assertStatus(404); // firstOrFail with notResolved scope
    }

    public function test_resolve_rejects_other_company_problem(): void
    {
        $otherUser = User::factory()->create(['email_verified_at' => now()]);
        $otherCompany = Company::factory()->create(['user_id' => $otherUser->id]);

        $problem = DetectedProblem::create([
            'company_id' => $otherCompany->id,
            'title' => 'Other company problem',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_OPEN,
            'ai_hash' => 'other-company',
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('radar.problems.resolve', ['id' => $problem->id]));

        $response->assertStatus(404);
    }

    // ═══════════════════════════════════════════════════════════
    // 8. CONTROLLER: Reopen endpoint
    // ═══════════════════════════════════════════════════════════

    public function test_reopen_endpoint_reopens_resolved_problem(): void
    {
        $problem = DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'To reopen',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_RESOLVED,
            'resolved_at' => now(),
            'ai_hash' => 'reopen-api',
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('radar.problems.reopen', ['id' => $problem->id]));

        $response->assertRedirect();
        $this->assertEquals(DetectedProblem::STATUS_OPEN, $problem->fresh()->status);
        $this->assertNull($problem->fresh()->resolved_at);
    }

    public function test_reopen_rejects_non_resolved(): void
    {
        $problem = DetectedProblem::create([
            'company_id' => $this->company->id,
            'title' => 'Still open',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_OPEN,
            'ai_hash' => 'not-resolved-yet',
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('radar.problems.reopen', ['id' => $problem->id]));

        $response->assertStatus(404);
    }

    public function test_reopen_rejects_other_company(): void
    {
        $otherUser = User::factory()->create(['email_verified_at' => now()]);
        $otherCompany = Company::factory()->create(['user_id' => $otherUser->id]);

        $problem = DetectedProblem::create([
            'company_id' => $otherCompany->id,
            'title' => 'Other',
            'type' => DetectedProblem::TYPE_PROBLEM,
            'status' => DetectedProblem::STATUS_RESOLVED,
            'resolved_at' => now(),
            'ai_hash' => 'other-reopen',
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('radar.problems.reopen', ['id' => $problem->id]));

        $response->assertStatus(404);
    }

    // ═══════════════════════════════════════════════════════════
    // 9. DUAL-LAYER: Feedback scopes for IA vs Stats
    // ═══════════════════════════════════════════════════════════

    public function test_feedback_not_resolved_scope_excludes_resolved(): void
    {
        $this->createFeedback(['rating' => 1, 'comment' => 'Unresolved']);
        $this->createFeedback(['rating' => 1, 'comment' => 'Resolved', 'resolved_at' => now()]);

        $unresolvedOnly = Feedback::notResolved()->get();
        $this->assertCount(1, $unresolvedOnly);
        $this->assertEquals('Unresolved', $unresolvedOnly->first()->comment);
    }

    public function test_feedback_resolved_scope_includes_only_resolved(): void
    {
        $this->createFeedback(['rating' => 4, 'comment' => 'Unresolved']);
        $this->createFeedback(['rating' => 4, 'comment' => 'Resolved', 'resolved_at' => now()]);

        $resolvedOnly = Feedback::resolved()->get();
        $this->assertCount(1, $resolvedOnly);
        $this->assertEquals('Resolved', $resolvedOnly->first()->comment);
    }

    // ═══════════════════════════════════════════════════════════
    // 10. UNAUTHENTICATED: Routes are protected
    // ═══════════════════════════════════════════════════════════

    public function test_resolve_requires_authentication(): void
    {
        $response = $this->post(route('radar.problems.resolve', ['id' => 1]));
        $response->assertRedirect(route('login'));
    }

    public function test_reopen_requires_authentication(): void
    {
        $response = $this->post(route('radar.problems.reopen', ['id' => 1]));
        $response->assertRedirect(route('login'));
    }

    // ═══════════════════════════════════════════════════════════
    // HELPER: Call syncDetectedProblems via reflection
    // ═══════════════════════════════════════════════════════════

    private function callSync(array $feedbackSummary, array $analysisPayload): void
    {
        $controller = app(\App\Http\Controllers\DashboardController::class);
        $method = new \ReflectionMethod($controller, 'syncDetectedProblems');
        $method->setAccessible(true);
        $method->invoke($controller, $this->company, $feedbackSummary, $analysisPayload);
    }
}

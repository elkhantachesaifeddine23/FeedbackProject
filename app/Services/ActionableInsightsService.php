<?php

namespace App\Services;

/**
 * Transforme les signaux d'IA en actions réelles et spécifiques.
 * 
 * Expert data engineer view:
 * - Corrèle les problèmes détectés avec des plans d'action concrets
 * - Chaque action est tracée à son problème source
 * - Priorités basées sur impact × fréquence × severity
 */
class ActionableInsightsService
{
    /**
     * Génère des actions recommandées basées sur les problèmes détectés
     * 
     * @param array $analysis - Résultat de RadarAnalysisService
     * @param array $data - Context (stats, signals, etc.)
     * @return array - Actions structurées et priorisées
     */
    public function generateActionsFromProblems(array $analysis, array $data = []): array
    {
        $signals = $analysis['signals'] ?? [];
        $keyIssues = $analysis['keyIssues'] ?? [];
        
        // Combiner les signaux et key issues pour une vue exhaustive
        $allProblems = $this->mergeProblemsAndSignals($signals, $keyIssues);
        
        // Générer une action par problème
        $actions = [];
        foreach ($allProblems as $problem) {
            $action = $this->createActionForProblem($problem, $data);
            if ($action) {
                $actions[] = $action;
            }
        }
        
        // Trier par priorité (P0 > P1 > P2) puis par impact
        usort($actions, function ($a, $b) {
            $priorityOrder = ['P0' => 0, 'P1' => 1, 'P2' => 2];
            $aPriority = $priorityOrder[$a['priority']] ?? 2;
            $bPriority = $priorityOrder[$b['priority']] ?? 2;
            
            if ($aPriority !== $bPriority) {
                return $aPriority <=> $bPriority;
            }
            
            // Si même priorité, trier par impact
            return (($b['impact_score'] ?? 0) <=> ($a['impact_score'] ?? 0));
        });
        
        return $actions;
    }
    
    /**
     * Fusionne les signaux et key issues en liste unique de problèmes
     */
    private function mergeProblemsAndSignals(array $signals, array $keyIssues): array
    {
        $problems = [];
        
        // Ajouter les signaux (surtout ceux de catégorie 'risk')
        foreach ($signals as $signal) {
            $problems[] = [
                'type' => 'signal',
                'title' => $signal['title'] ?? '',
                'detail' => $signal['detail'] ?? '',
                'severity' => $signal['severity'] ?? 'medium',
                'evidence_count' => $signal['evidence_count'] ?? 1,
                'category' => $signal['category'] ?? 'risk',
            ];
        }
        
        // Ajouter les key issues
        foreach ($keyIssues as $issue) {
            $problems[] = [
                'type' => 'issue',
                'title' => $issue['title'] ?? '',
                'detail' => $issue['detail'] ?? '',
                'severity' => $issue['impact'] ?? 'medium',
                'evidence_count' => $issue['count'] ?? 1,
                'category' => 'risk',
            ];
        }
        
        return $problems;
    }
    
    /**
     * Crée une action spécifique pour un problème donné
     * 
     * Expert engineering: chaque action a une chaîne de responsabilité claire
     */
    private function createActionForProblem(array $problem, array $context = []): ?array
    {
        $title = trim($problem['title'] ?? '');
        $detail = trim($problem['detail'] ?? '');
        $severity = $problem['severity'] ?? 'medium';
        $evidenceCount = (int)($problem['evidence_count'] ?? 1);
        
        if (!$title) {
            return null;
        }
        
        // Générer une action concrète basée sur le problème
        $actionPlan = $this->mapProblemToAction($title, $detail, $severity, $evidenceCount);
        
        return [
            'title' => $actionPlan['title'],
            'detail' => $actionPlan['detail'],
            'priority' => $actionPlan['priority'],
            'impact_score' => $actionPlan['impact_score'],
            'problem_source' => $title,
            'problem_severity' => $severity,
            'mention_count' => $evidenceCount,
            'timeline' => $actionPlan['timeline'],
            'owner_role' => $actionPlan['owner_role'],
            'kpi_to_track' => $actionPlan['kpi_to_track'],
        ];
    }
    
    /**
     * Mappe un problème détecté à une action concrète
     * 
     * Cette méthode est le cœur de la magie : transformer du feedback texte
     * en plan d'action structuré avec timeline et KPIs
     */
    private function mapProblemToAction(string $title, string $detail, string $severity, int $evidenceCount): array
    {
        $lower = mb_strtolower($title . ' ' . $detail);
        
        // Détecter les patterns de problème et mapper à des actions
        
        // 1. LENTEUR / DÉLAI D'ATTENTE
        if ($this->matches($lower, ['lent', 'attente', 'delai', 'rapide', 'attend', 'minutes', 'longueur'])) {
            return [
                'title' => 'Réduire les temps d\'attente (cible -20% en 7j)',
                'detail' => 'Analyser les étapes du processus, optimiser les goulots, augmenter la capacité',
                'priority' => $severity === 'high' ? 'P0' : 'P1',
                'impact_score' => $evidenceCount * 3,
                'timeline' => '7 jours',
                'owner_role' => 'Opérations / Chef de service',
                'kpi_to_track' => 'Temps d\'attente moyen, % clients satisfaits du délai',
            ];
        }
        
        // 2. QUALITÉ DU PRODUIT / TEMPÉRATURE
        if ($this->matches($lower, ['froid', 'qualité', 'frais', 'température', 'mauvais', 'ignoble', 'immangeable', 'état'])) {
            return [
                'title' => 'Améliorer la qualité des produits (audit + correction)',
                'detail' => 'Vérifier chaîne du froid, contrôle qualité, formation staff, audits réguliers',
                'priority' => $severity === 'high' ? 'P0' : 'P1',
                'impact_score' => $evidenceCount * 3,
                'timeline' => '3 à 5 jours',
                'owner_role' => 'Chef de cuisine / Responsable qualité',
                'kpi_to_track' => 'Plaintes qualité, scores de fraîcheur, audits qualité',
            ];
        }
        
        // 3. EXACTITUDE DES COMMANDES
        if ($this->matches($lower, ['manque', 'incomplète', 'oublie', 'oublié', 'exact', 'erreur', 'commande'])) {
            return [
                'title' => 'Garantir 100% exactitude des commandes (checklist)',
                'detail' => 'Implémenter double-vérification, formation, système de tracking',
                'priority' => $severity === 'high' ? 'P0' : 'P1',
                'impact_score' => $evidenceCount * 2.5,
                'timeline' => '5 à 7 jours',
                'owner_role' => 'Chef de cuisine / Service',
                'kpi_to_track' => 'Taux d\'erreur commande, client satisfaction',
            ];
        }
        
        // 4. SERVICE / COMPORTEMENT STAFF
        if ($this->matches($lower, ['serveur', 'aimable', 'rude', 'pressé', 'attentif', 'sourire', 'accueil'])) {
            return [
                'title' => 'Renforcer la formation et qualité du service client',
                'detail' => 'Programme de formation CX, coaching individuel, feedback régulier',
                'priority' => $severity === 'high' ? 'P0' : 'P1',
                'impact_score' => $evidenceCount * 2.5,
                'timeline' => '10 à 14 jours',
                'owner_role' => 'Manager / RH',
                'kpi_to_track' => 'NPS, politesse, temps de réponse',
            ];
        }
        
        // 5. ENVIRONNEMENT / AMBIANCE
        if ($this->matches($lower, ['bruit', 'ambiance', 'propreté', 'décor', 'atmosphere', 'bruyant'])) {
            return [
                'title' => 'Optimiser l\'environnement (bruit, propreté, décor)',
                'detail' => 'Audit ambiance, isolation acoustique, nettoyage + fréquence, réaménagement',
                'priority' => $severity === 'high' ? 'P0' : 'P1',
                'impact_score' => $evidenceCount * 2,
                'timeline' => '7 à 14 jours',
                'owner_role' => 'Directeur / Facilities',
                'kpi_to_track' => 'Score ambiance, % clients satisfaits',
            ];
        }
        
        // 6. PRIX / VALEUR
        if ($this->matches($lower, ['prix', 'coût', 'cher', 'rapport qualité', 'expensive'])) {
            return [
                'title' => 'Réévaluer rapport qualité-prix (menu, portions, tarifs)',
                'detail' => 'Analyse coûts, ajustement menu/prix, portions optimisées',
                'priority' => 'P1',
                'impact_score' => $evidenceCount * 2,
                'timeline' => '14 à 21 jours',
                'owner_role' => 'Manager / Directeur',
                'kpi_to_track' => 'Satisfaction tarif, conversion, panier moyen',
            ];
        }
        
        // 7. FRAÎCHEUR / INGRÉDIENTS
        if ($this->matches($lower, ['fraîcheur', 'ingrédient', 'frais', 'bio', 'source', 'local'])) {
            return [
                'title' => 'Améliorer sourcing et transparence des ingrédients',
                'detail' => 'Audit fournisseurs, valoriser local, transparence menu',
                'priority' => 'P1',
                'impact_score' => $evidenceCount * 2,
                'timeline' => '14 à 30 jours',
                'owner_role' => 'Chef / Approvisionnement',
                'kpi_to_track' => 'Satisfaction produits, % local, feedback fraîcheur',
            ];
        }
        
        // 8. COMMUNICATION / TRANSPARENCE
        if ($this->matches($lower, ['communiqu', 'transparent', 'comprendre', 'info', 'clair'])) {
            return [
                'title' => 'Améliorer la communication client (clarity, expectation)',
                'detail' => 'Menu clair, affichage délais, descriptifs produits détaillés',
                'priority' => 'P1',
                'impact_score' => $evidenceCount * 1.5,
                'timeline' => '5 à 7 jours',
                'owner_role' => 'Marketing / Service',
                'kpi_to_track' => 'Satisfaction clarté, expectation vs réalité',
            ];
        }
        
        // Default fallback
        return [
            'title' => 'Traiter le problème : ' . $title,
            'detail' => $detail ?: 'Problème détecté et doit être priorisé pour amélioration.',
            'priority' => $severity === 'high' ? 'P0' : ($severity === 'medium' ? 'P1' : 'P2'),
            'impact_score' => $evidenceCount,
            'timeline' => '7 à 14 jours',
            'owner_role' => 'À définir',
            'kpi_to_track' => 'Satisfaction, feedback négatif',
        ];
    }
    
    /**
     * Vérifie si le texte contient un des patterns
     */
    private function matches(string $text, array $patterns): bool
    {
        foreach ($patterns as $pattern) {
            if (mb_strpos($text, $pattern) !== false) {
                return true;
            }
        }
        return false;
    }
}

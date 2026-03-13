<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Radar IA - {{ $company->name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            color: #1f2937;
            line-height: 1.4;
        }
        
        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 30px;
            margin-bottom: 30px;
            border-radius: 8px;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: bold;
        }
        
        .header .meta {
            font-size: 12px;
            opacity: 0.9;
        }
        
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        
        .section-title {
            background-color: #f3f4f6;
            padding: 12px 15px;
            font-size: 16px;
            font-weight: bold;
            color: #1e3a8a;
            border-left: 4px solid #1e3a8a;
            margin-bottom: 15px;
        }
        
        .stats-grid {
            display: table;
            width: 100%;
            margin-bottom: 15px;
        }
        
        .stat-row {
            display: table-row;
        }
        
        .stat-cell {
            display: table-cell;
            padding: 8px 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .stat-cell.label {
            font-weight: 600;
            width: 40%;
            background-color: #f9fafb;
        }
        
        .stat-cell.value {
            width: 60%;
        }
        
        .score-box {
            background-color: #dbeafe;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 15px 0;
        }
        
        .score-box .score {
            font-size: 48px;
            font-weight: bold;
            color: #1e3a8a;
        }
        
        .score-box .label {
            font-size: 14px;
            color: #6b7280;
            margin-top: 5px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        
        th {
            background-color: #1e3a8a;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
        }
        
        td {
            padding: 8px 10px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .badge-high { background-color: #fee2e2; color: #991b1b; }
        .badge-medium { background-color: #fef3c7; color: #92400e; }
        .badge-low { background-color: #dbeafe; color: #1e40af; }
        .badge-critical { background-color: #fecaca; color: #7f1d1d; }
        .badge-warning { background-color: #fed7aa; color: #7c2d12; }
        .badge-info { background-color: #bfdbfe; color: #1e3a8a; }
        
        .trend-positive { color: #059669; font-weight: 600; }
        .trend-negative { color: #dc2626; font-weight: 600; }
        .trend-neutral { color: #6b7280; }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
        }
        
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    {{-- Header --}}
    <div class="header">
        <h1>📊 Radar IA - Analyse {{ $days }} jours</h1>
        <div class="meta">
            <strong>{{ $company->name }}</strong><br>
            Période : {{ $data['period']['from'] }} → {{ $data['period']['to'] }}<br>
            Généré le {{ $generatedAt }}
        </div>
    </div>

    {{-- Health Score --}}
    <div class="section">
        <div class="section-title">🎯 Health Score</div>
        <div class="score-box">
            <div class="score">{{ $data['healthScore']['score'] }}/100</div>
            <div class="label">Score de santé global</div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-row">
                <div class="stat-cell label">Score note</div>
                <div class="stat-cell value">{{ $data['healthScore']['drivers']['rating_score'] ?? '—' }}</div>
            </div>
            <div class="stat-row">
                <div class="stat-cell label">Pénalité négatif</div>
                <div class="stat-cell value">{{ $data['healthScore']['drivers']['negative_penalty'] ?? '—' }}</div>
            </div>
            <div class="stat-row">
                <div class="stat-cell label">Pénalité réponse</div>
                <div class="stat-cell value">{{ $data['healthScore']['drivers']['response_penalty'] ?? '—' }}</div>
            </div>
            <div class="stat-row">
                <div class="stat-cell label">Pénalité échecs</div>
                <div class="stat-cell value">{{ $data['healthScore']['drivers']['failed_penalty'] ?? '—' }}</div>
            </div>
        </div>
    </div>

    {{-- KPIs --}}
    <div class="section">
        <div class="section-title">📈 KPIs Principaux</div>
        <div class="stats-grid">
            <div class="stat-row">
                <div class="stat-cell label">Total Feedbacks</div>
                <div class="stat-cell value">{{ $data['stats']['total'] }}</div>
            </div>
            <div class="stat-row">
                <div class="stat-cell label">Taux positif</div>
                <div class="stat-cell value">{{ $data['stats']['positiveRate'] }}%</div>
            </div>
            <div class="stat-row">
                <div class="stat-cell label">Taux négatif</div>
                <div class="stat-cell value">{{ $data['stats']['negativeRate'] }}%</div>
            </div>
            <div class="stat-row">
                <div class="stat-cell label">Note moyenne</div>
                <div class="stat-cell value">{{ $data['stats']['avgRating'] ?? '—' }}</div>
            </div>
            <div class="stat-row">
                <div class="stat-cell label">Taux de réponse</div>
                <div class="stat-cell value">{{ $data['stats']['responseRate'] }}%</div>
            </div>
        </div>
    </div>

    {{-- Tendances --}}
    <div class="section">
        <div class="section-title">📊 Tendances (vs période précédente)</div>
        <table>
            <thead>
                <tr>
                    <th>Métrique</th>
                    <th>Actuel</th>
                    <th>Précédent</th>
                    <th>Delta</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Taux positif</td>
                    <td>{{ $data['trends']['positiveRate']['current'] }}%</td>
                    <td>{{ $data['trends']['positiveRate']['previous'] }}%</td>
                    <td class="{{ $data['trends']['positiveRate']['delta'] > 0 ? 'trend-positive' : ($data['trends']['positiveRate']['delta'] < 0 ? 'trend-negative' : 'trend-neutral') }}">
                        {{ $data['trends']['positiveRate']['delta'] > 0 ? '+' : '' }}{{ $data['trends']['positiveRate']['delta'] }}%
                    </td>
                </tr>
                <tr>
                    <td>Taux négatif</td>
                    <td>{{ $data['trends']['negativeRate']['current'] }}%</td>
                    <td>{{ $data['trends']['negativeRate']['previous'] }}%</td>
                    <td class="{{ $data['trends']['negativeRate']['delta'] < 0 ? 'trend-positive' : ($data['trends']['negativeRate']['delta'] > 0 ? 'trend-negative' : 'trend-neutral') }}">
                        {{ $data['trends']['negativeRate']['delta'] > 0 ? '+' : '' }}{{ $data['trends']['negativeRate']['delta'] }}%
                    </td>
                </tr>
                <tr>
                    <td>Taux de réponse</td>
                    <td>{{ $data['trends']['responseRate']['current'] }}%</td>
                    <td>{{ $data['trends']['responseRate']['previous'] }}%</td>
                    <td class="{{ $data['trends']['responseRate']['delta'] > 0 ? 'trend-positive' : ($data['trends']['responseRate']['delta'] < 0 ? 'trend-negative' : 'trend-neutral') }}">
                        {{ $data['trends']['responseRate']['delta'] > 0 ? '+' : '' }}{{ $data['trends']['responseRate']['delta'] }}%
                    </td>
                </tr>
                <tr>
                    <td>Note moyenne</td>
                    <td>{{ $data['trends']['avgRating']['current'] ?? '—' }}</td>
                    <td>{{ $data['trends']['avgRating']['previous'] ?? '—' }}</td>
                    <td class="{{ isset($data['trends']['avgRating']['delta']) && $data['trends']['avgRating']['delta'] > 0 ? 'trend-positive' : (isset($data['trends']['avgRating']['delta']) && $data['trends']['avgRating']['delta'] < 0 ? 'trend-negative' : 'trend-neutral') }}">
                        {{ isset($data['trends']['avgRating']['delta']) ? ($data['trends']['avgRating']['delta'] > 0 ? '+' : '') . $data['trends']['avgRating']['delta'] : '—' }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="page-break"></div>

    {{-- Benchmarks --}}
    <div class="section">
        <div class="section-title">🏆 Benchmarks</div>
        <table>
            <thead>
                <tr>
                    <th>Métrique</th>
                    <th>Votre entreprise</th>
                    <th>Médiane</th>
                    <th>Percentile</th>
                </tr>
            </thead>
            <tbody>
                @foreach($data['benchmarks'] as $benchmark)
                <tr>
                    <td>{{ $benchmark['label'] }}</td>
                    <td>{{ $benchmark['company'] ?? '—' }}</td>
                    <td>{{ $benchmark['median'] ?? '—' }}</td>
                    <td>{{ $benchmark['percentile'] !== null ? $benchmark['percentile'] . '%' : '—' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    {{-- Synthèse IA --}}
    @if(!empty($summaryText))
    <div class="section">
        <div class="section-title">🧠 Synthèse IA</div>
        <div style="padding: 12px 15px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; line-height: 1.6;">
            {{ $summaryText }}
        </div>
    </div>
    @endif

    {{-- Problèmes Détectés (ouverts) --}}
    @if($detectedProblems->count() > 0)
    <div class="section">
        <div class="section-title">🔴 Problèmes Détectés — En attente de traitement</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 22%;">Problème</th>
                    <th style="width: 28%;">Détail</th>
                    <th style="width: 25%;">Solution proposée</th>
                    <th>Impact</th>
                    <th>Urgence</th>
                    <th>Effort</th>
                </tr>
            </thead>
            <tbody>
                @foreach($detectedProblems as $problem)
                <tr>
                    <td style="font-weight: 600;">{{ $problem->title }}</td>
                    <td style="font-size: 9px;">{{ Str::limit($problem->detail, 120) }}</td>
                    <td style="font-size: 9px;">{{ Str::limit($problem->solution, 120) }}</td>
                    <td>
                        @php
                            $impact = strtolower($problem->impact ?? 'moyen');
                            $badgeClass = 'badge-medium';
                            if ($impact === 'fort') $badgeClass = 'badge-high';
                            elseif ($impact === 'faible') $badgeClass = 'badge-low';
                        @endphp
                        <span class="badge {{ $badgeClass }}">{{ $problem->impact ?? '—' }}</span>
                    </td>
                    <td>
                        @php
                            $urgency = strtolower($problem->urgency ?? '');
                            $uBadge = 'badge-info';
                            if (str_contains($urgency, 'imm')) $uBadge = 'badge-critical';
                            elseif (str_contains($urgency, 'court')) $uBadge = 'badge-warning';
                        @endphp
                        <span class="badge {{ $uBadge }}">{{ $problem->urgency ?? '—' }}</span>
                    </td>
                    <td>
                        @php
                            $effort = strtolower($problem->effort ?? 'moyen');
                            $eBadge = 'badge-info';
                            if ($effort === 'faible') $eBadge = 'badge-low';
                            elseif (str_contains($effort, 'lev') || str_contains($effort, 'élev')) $eBadge = 'badge-high';
                        @endphp
                        <span class="badge {{ $eBadge }}">{{ $problem->effort ?? '—' }}</span>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    {{-- Décisions Suggérées (ouvertes) --}}
    @if($detectedDecisions->count() > 0)
    <div class="section">
        <div class="section-title">💡 Décisions Suggérées — En attente</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 25%;">Décision</th>
                    <th style="width: 40%;">Détail</th>
                    <th>Impact</th>
                    <th>Urgence</th>
                </tr>
            </thead>
            <tbody>
                @foreach($detectedDecisions as $decision)
                <tr>
                    <td style="font-weight: 600;">{{ $decision->title }}</td>
                    <td style="font-size: 9px;">{{ Str::limit($decision->detail, 180) }}</td>
                    <td>
                        @php
                            $impact = strtolower($decision->impact ?? 'moyen');
                            $badgeClass = 'badge-medium';
                            if ($impact === 'fort') $badgeClass = 'badge-high';
                            elseif ($impact === 'faible') $badgeClass = 'badge-low';
                        @endphp
                        <span class="badge {{ $badgeClass }}">{{ $decision->impact ?? '—' }}</span>
                    </td>
                    <td>
                        @php
                            $urgency = strtolower($decision->urgency ?? '');
                            $uBadge = 'badge-info';
                            if (str_contains($urgency, 'imm')) $uBadge = 'badge-critical';
                            elseif (str_contains($urgency, 'court')) $uBadge = 'badge-warning';
                        @endphp
                        <span class="badge {{ $uBadge }}">{{ $decision->urgency ?? '—' }}</span>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    {{-- Problèmes/Décisions pris en charge (avec tâche) --}}
    @if($handledProblems->count() > 0 || $handledDecisions->count() > 0)
    <div class="section">
        <div class="section-title">✅ Éléments pris en charge (tâche créée)</div>
        <table>
            <thead>
                <tr>
                    <th>Type</th>
                    <th style="width: 25%;">Titre</th>
                    <th style="width: 30%;">Détail</th>
                    <th>Impact</th>
                    <th>Statut tâche</th>
                </tr>
            </thead>
            <tbody>
                @foreach($handledProblems as $item)
                <tr>
                    <td><span class="badge badge-critical">Problème</span></td>
                    <td style="font-weight: 600;">{{ $item->title }}</td>
                    <td style="font-size: 9px;">{{ Str::limit($item->detail, 150) }}</td>
                    <td>
                        @php
                            $impact = strtolower($item->impact ?? 'moyen');
                            $badgeClass = 'badge-medium';
                            if ($impact === 'fort') $badgeClass = 'badge-high';
                            elseif ($impact === 'faible') $badgeClass = 'badge-low';
                        @endphp
                        <span class="badge {{ $badgeClass }}">{{ $item->impact ?? '—' }}</span>
                    </td>
                    <td>
                        @php
                            $task = $item->tasks->first();
                            $statusLabels = ['not_started' => 'Non démarré', 'in_progress' => 'En cours', 'completed' => 'Terminé'];
                            $statusBadge = 'badge-info';
                            if ($task && $task->status === 'completed') $statusBadge = 'badge-low';
                            elseif ($task && $task->status === 'in_progress') $statusBadge = 'badge-warning';
                        @endphp
                        <span class="badge {{ $statusBadge }}">{{ $task ? ($statusLabels[$task->status] ?? $task->status) : '—' }}</span>
                    </td>
                </tr>
                @endforeach
                @foreach($handledDecisions as $item)
                <tr>
                    <td><span class="badge badge-warning">Décision</span></td>
                    <td style="font-weight: 600;">{{ $item->title }}</td>
                    <td style="font-size: 9px;">{{ Str::limit($item->detail, 150) }}</td>
                    <td>
                        @php
                            $impact = strtolower($item->impact ?? 'moyen');
                            $badgeClass = 'badge-medium';
                            if ($impact === 'fort') $badgeClass = 'badge-high';
                            elseif ($impact === 'faible') $badgeClass = 'badge-low';
                        @endphp
                        <span class="badge {{ $badgeClass }}">{{ $item->impact ?? '—' }}</span>
                    </td>
                    <td>
                        @php
                            $task = $item->tasks->first();
                            $statusLabels = ['not_started' => 'Non démarré', 'in_progress' => 'En cours', 'completed' => 'Terminé'];
                            $statusBadge = 'badge-info';
                            if ($task && $task->status === 'completed') $statusBadge = 'badge-low';
                            elseif ($task && $task->status === 'in_progress') $statusBadge = 'badge-warning';
                        @endphp
                        <span class="badge {{ $statusBadge }}">{{ $task ? ($statusLabels[$task->status] ?? $task->status) : '—' }}</span>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    {{-- Signals --}}
    @if(!empty($data['signals']))
    <div class="section">
        <div class="section-title">⚠️ Signaux Statistiques</div>
        <table>
            <thead>
                <tr>
                    <th>Signal</th>
                    <th>Catégorie</th>
                    <th>Sévérité</th>
                    <th>Détail</th>
                </tr>
            </thead>
            <tbody>
                @foreach($data['signals'] as $signal)
                <tr>
                    <td>{{ $signal['title'] ?? '' }}</td>
                    <td>{{ strtoupper($signal['category'] ?? '') }}</td>
                    <td>
                        @php
                            $severity = strtolower($signal['severity'] ?? 'info');
                            $badgeClass = 'badge-info';
                            if ($severity === 'critical') $badgeClass = 'badge-critical';
                            elseif ($severity === 'warning') $badgeClass = 'badge-warning';
                        @endphp
                        <span class="badge {{ $badgeClass }}">{{ strtoupper($signal['severity'] ?? '') }}</span>
                    </td>
                    <td style="font-size: 9px;">{{ $signal['detail'] ?? '' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    {{-- Footer --}}
    <div class="footer">
        <strong>Luminea</strong> - Plateforme intelligente de gestion de feedbacks<br>
        Document généré automatiquement le {{ $generatedAt }}
    </div>
</body>
</html>

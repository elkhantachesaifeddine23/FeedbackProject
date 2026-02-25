<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rappel Feedback</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
    <h2>Bonjour {{ $customer }},</h2>
    <p>Petit rappel de la part de {{ $company }}.</p>
    <p>Votre avis nous aide énormément à améliorer notre service.</p>
    <p>
        <a href="{{ $link }}" style="display: inline-block; background: #4f46e5; color: #fff; padding: 10px 16px; text-decoration: none; border-radius: 6px;">
            Donner mon avis
        </a>
    </p>
    <p>Merci d’avance !</p>
</body>
</html>

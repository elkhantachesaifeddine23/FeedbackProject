<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demande de feedback</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f4f6fb; color: #1f2937; }
        .wrapper { width: 100%; padding: 24px 12px; }
        .container { max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; }
        .content { padding: 28px 24px; }
        .message { white-space: pre-line; line-height: 1.65; color: #374151; }
        .cta-wrap { text-align: center; margin: 26px 0; }
        .cta {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 24px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 15px;
        }
        .fallback { margin-top: 12px; font-size: 12px; color: #6b7280; word-break: break-all; }
        .footer { border-top: 1px solid #e5e7eb; background: #f9fafb; padding: 16px 24px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Votre avis compte 💙</h1>
            </div>

            <div class="content">
                <p>Bonjour {{ $customer }},</p>

                <div class="message">{!! nl2br(e($messageBody)) !!}</div>

                <div class="cta-wrap">
                    <a class="cta" href="{{ $link }}" target="_blank" rel="noopener noreferrer">
                        Donner mon avis
                    </a>
                    <div class="fallback">Si le bouton ne fonctionne pas, copiez ce lien : {{ $link }}</div>
                </div>

                <p style="margin-top: 0;">Merci pour votre temps 🙏</p>
                <p style="margin-bottom: 0;">L’équipe {{ $company }}</p>
            </div>

            <div class="footer">
                © {{ date('Y') }} {{ config('app.name') }}
            </div>
        </div>
    </div>
</body>
</html>

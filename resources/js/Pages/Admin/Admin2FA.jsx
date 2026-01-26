import { Head, Link, useForm } from '@inertiajs/react';

export default function Admin2FA({ status, email, expiresInSeconds = 30 }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('admin.2fa.verify'), {
            onFinish: () => reset('code'),
        });
    };

    return (
        <>
            <Head title="Validation 2FA Admin" />

            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md">
                    <h1 className="text-3xl font-bold text-center mb-4 text-gray-900">
                        Validation 2FA
                    </h1>

                    <p className="text-center text-gray-600 mb-4">
                        Entrez le code de 6 chiffres envoyé à {email || 'votre email admin'}.
                    </p>
                    <p className="text-center text-gray-500 mb-6 text-sm">
                        Le code est valide {expiresInSeconds} secondes.
                    </p>

                    {status && (
                        <div className="mb-4 text-sm text-green-600 bg-green-100 p-3 rounded-lg">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Code 2FA
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="000000"
                                autoComplete="one-time-code"
                                required
                            />
                            {errors.code && (
                                <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-lg"
                        >
                            {processing ? 'Verification...' : 'Valider le code'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-gray-600 text-sm">
                        <Link href={route('login')} className="text-blue-600 hover:underline">
                            Retour a la connexion
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

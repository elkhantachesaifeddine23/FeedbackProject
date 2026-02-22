import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center pt-6 sm:justify-center sm:pt-0 bg-white">
            <div>
                <Link href="/" className="flex items-center justify-center">
                    <img src="/images/logo_Luminea2.png" alt="Luminea" className="h-24 w-auto" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg border border-gray-200">
                {children}
            </div>
        </div>
    );
}

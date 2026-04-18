import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="text-9xl mb-4">🚕</div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h2>
          <p className="text-gray-600 text-lg mb-8">
            Oops! The page you're looking for seems to have taken a different route.
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/" className="btn-primary inline-block">
            Back to Home
          </Link>
          <Link href="/booking" className="btn-secondary inline-block ml-4">
            Book a Taxi
          </Link>
        </div>

        <div className="mt-12 p-6 bg-white rounded-xl shadow-md">
          <h3 className="font-bold text-gray-900 mb-3">Need Help?</h3>
          <p className="text-gray-600 text-sm mb-4">
            If you believe this is an error, please contact our support team.
          </p>
          <a href="tel:+2203456789" className="text-primary-600 hover:text-primary-800 font-semibold">
            📞 Call +220 345 6789
          </a>
        </div>
      </div>
    </div>
  );
}

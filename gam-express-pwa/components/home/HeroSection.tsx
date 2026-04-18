import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Book Your Taxi 
            <span className="block text-accent-300 mt-2">Quickly & Safely</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Simple, safe, and reliable taxi booking in The Gambia
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-4 mb-10 text-sm md:text-base">
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <span>✓</span>
              <span>Trusted Drivers</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <span>✓</span>
              <span>Mobile Money</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <span>✓</span>
              <span>24/7 Available</span>
            </div>
          </div>

          {/* CTA Button */}
          <Link 
            href="/booking"
            className="inline-block bg-accent-400 hover:bg-accent-500 text-white text-lg font-bold py-4 px-10 rounded-xl shadow-2xl hover:shadow-accent-500/50 transition-all duration-300 active:scale-95"
          >
            Book a Taxi Now 🚕
          </Link>

          {/* Secondary CTA */}
          <p className="mt-6 text-blue-100">
            Or call us at{' '}
            <a href="tel:+2203456789" className="font-bold text-accent-300 hover:underline">
              +220 345 6789
            </a>
          </p>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0L60 8.33C120 16.7 240 33.3 360 41.7C480 50 600 50 720 45C840 40 960 30 1080 28.3C1200 26.7 1320 33.3 1380 36.7L1440 40V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0V0Z" fill="rgb(249, 250, 251)"/>
        </svg>
      </div>
    </section>
  );
}

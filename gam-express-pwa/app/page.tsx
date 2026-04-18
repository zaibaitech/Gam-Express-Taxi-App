'use client';

import { useState } from 'react';
import HeroSection from '@/components/home/HeroSection';
import FeatureGrid from '@/components/ui/FeatureGrid';
import { Feature, HowItWorksStep } from '@/types';
import Link from 'next/link';

export default function HomePage() {
  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);

  // Mock features data
  const features: Feature[] = [
    {
      title: 'Fast Booking',
      description: 'Book your taxi in under 2 minutes with our simple form',
      icon: '⚡',
    },
    {
      title: 'Trusted Drivers',
      description: 'All our drivers are verified and experienced professionals',
      icon: '🛡️',
    },
    {
      title: 'Mobile Money',
      description: 'Pay securely with QCell, Africell, or Comium mobile money',
      icon: '📱',
    },
    {
      title: 'Easy Support',
      description: '24/7 customer support via phone and WhatsApp',
      icon: '💬',
    },
  ];

  // How it works steps
  const howItWorksSteps: HowItWorksStep[] = [
    {
      step: 1,
      title: 'Enter Your Details',
      description: 'Tell us where you are and where you want to go',
    },
    {
      step: 2,
      title: 'Choose Payment',
      description: 'Select mobile money or cash payment method',
    },
    {
      step: 3,
      title: 'Get Your Taxi',
      description: 'A driver will be assigned and contact you shortly',
    },
  ];

  // Mock booking status check
  const handleTrackBooking = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock data - in real app would fetch from API
    if (trackingId.toUpperCase().startsWith('GMX-')) {
      setTrackingResult({
        id: trackingId.toUpperCase(),
        status: 'assigned',
        pickupLocation: 'Serrekunda Market',
        dropoffLocation: 'Banjul Airport',
        driverName: 'Ousman Jallow',
        vehicleNumber: 'BJL 1234',
        estimatedArrival: '15 minutes',
      });
    } else {
      setTrackingResult({ error: 'Booking not found. Please check your reference ID.' });
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Gam Express Taxi?
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            We make taxi booking simple, safe, and reliable for everyone in The Gambia
          </p>
        </div>

        <FeatureGrid features={features} />
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 text-lg">
              Get your taxi in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorksSteps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 text-white text-2xl font-bold rounded-full mb-4 shadow-lg">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/booking" className="btn-primary">
              Start Booking Now
            </Link>
          </div>
        </div>
      </section>

      {/* Track Booking Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <span className="text-3xl">🔍</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Track Your Booking
              </h2>
              <p className="text-gray-600">
                Enter your booking reference to check the status
              </p>
            </div>

            <form onSubmit={handleTrackBooking} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Enter booking reference (e.g., GMX-ABC123)"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="input-field uppercase"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                Track Booking
              </button>
            </form>

            {/* Tracking Result */}
            {trackingResult && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                {trackingResult.error ? (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                    <p className="text-red-800">{trackingResult.error}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                      <p className="text-green-800 font-semibold">
                        ✓ Booking Found: {trackingResult.id}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600">Status</span>
                        <span className="font-semibold text-green-700">Driver Assigned 🚕</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600">Driver</span>
                        <span className="font-semibold">{trackingResult.driverName}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600">Vehicle</span>
                        <span className="font-semibold">{trackingResult.vehicleNumber}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600">Pickup</span>
                        <span className="font-semibold text-right">{trackingResult.pickupLocation}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600">Drop-off</span>
                        <span className="font-semibold text-right">{trackingResult.dropoffLocation}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Est. Arrival</span>
                        <span className="font-semibold text-primary-700">{trackingResult.estimatedArrival}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Book Your Taxi?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Simple, fast, and reliable taxi service at your fingertips
          </p>
          <Link href="/booking" className="inline-block bg-accent-400 hover:bg-accent-500 text-white text-lg font-bold py-4 px-10 rounded-xl shadow-2xl transition-all duration-300 active:scale-95">
            Book Now
          </Link>
        </div>
      </section>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateBookingId, calculateEstimatedFare, isValidPhoneNumber, isPlusCode, normalisePlusCode } from '@/lib/utils';
import FareEstimateCard from '@/components/booking/FareEstimateCard';
import PaymentMethodSelector from '@/components/booking/PaymentMethodSelector';
import LocationInput from '@/components/booking/LocationInput';

export default function BookingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedFare, setEstimatedFare] = useState(0);
  const [submitError, setSubmitError] = useState('');

  const [formData, setFormData] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    pickupTime: 'now',
    customDateTime: '',
    customerName: '',
    phoneNumber: '',
    notes: '',
    paymentMethod: 'mobile_money' as 'mobile_money' | 'cash',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (formData.pickupLocation && formData.dropoffLocation) {
      setEstimatedFare(calculateEstimatedFare(formData.pickupLocation, formData.dropoffLocation));
    } else {
      setEstimatedFare(0);
    }
  }, [formData.pickupLocation, formData.dropoffLocation]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }
    setSubmitError('');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.pickupLocation.trim()) newErrors.pickupLocation = 'Pickup location is required';
    if (!formData.dropoffLocation.trim()) newErrors.dropoffLocation = 'Drop-off location is required';
    if (!formData.customerName.trim()) newErrors.customerName = 'Your name is required';
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!isValidPhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid Gambian phone number';
    }
    if (formData.pickupTime === 'custom' && !formData.customDateTime) {
      newErrors.customDateTime = 'Please select a date and time';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const bookingRef = generateBookingId();

      const pickup = isPlusCode(formData.pickupLocation)
        ? normalisePlusCode(formData.pickupLocation)
        : formData.pickupLocation.trim();
      const dropoff = isPlusCode(formData.dropoffLocation)
        ? normalisePlusCode(formData.dropoffLocation)
        : formData.dropoffLocation.trim();

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_reference: bookingRef,
          customer_name: formData.customerName.trim(),
          customer_phone: formData.phoneNumber.trim(),
          pickup_address: pickup,
          dropoff_address: dropoff,
          estimated_fare: estimatedFare || null,
          payment_method: formData.paymentMethod,
          notes: formData.notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create booking.');

      // Store confirmation data for the confirmation page
      sessionStorage.setItem('currentBooking', JSON.stringify({
        id: data.booking_reference as string,
        dbId: data.id as string,
        pickupLocation: formData.pickupLocation,
        dropoffLocation: formData.dropoffLocation,
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        estimatedFare,
        paymentMethod: formData.paymentMethod,
        status: 'pending',
      }));

      router.push('/confirmation');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      setSubmitError(msg ?? 'Could not submit your booking. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-primary-700 hover:text-primary-900 mb-4 font-semibold"
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Book Your Taxi</h1>
          <p className="text-gray-600 text-lg">
            Fill in the details below and we'll assign a driver to your trip
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="card space-y-6">

              {/* Trip Details */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <span>🗺️</span><span>Trip Details</span>
                </h2>
                <div className="space-y-4">
                  <LocationInput
                    id="pickupLocation"
                    label="Where should we pick you up? *"
                    placeholder="Type area/street, use 📍 for GPS, or paste Plus Code"
                    value={formData.pickupLocation}
                    error={errors.pickupLocation}
                    onChange={(v) => setFormData(prev => ({ ...prev, pickupLocation: v }))}
                  />

                  <LocationInput
                    id="dropoffLocation"
                    label="Where are you going? *"
                    placeholder="Type area/street, use 📍 for GPS, or paste Plus Code"
                    value={formData.dropoffLocation}
                    error={errors.dropoffLocation}
                    onChange={(v) => setFormData(prev => ({ ...prev, dropoffLocation: v }))}
                  />

                  <div>
                    <label htmlFor="pickupTime" className="label">When do you need the taxi? *</label>
                    <select id="pickupTime" name="pickupTime" value={formData.pickupTime} onChange={handleChange} className="input-field">
                      <option value="now">As soon as possible</option>
                      <option value="custom">Schedule for later</option>
                    </select>
                  </div>

                  {formData.pickupTime === 'custom' && (
                    <div>
                      <label htmlFor="customDateTime" className="label">Select date and time *</label>
                      <input
                        type="datetime-local" id="customDateTime" name="customDateTime"
                        value={formData.customDateTime} onChange={handleChange}
                        min={new Date().toISOString().slice(0, 16)}
                        className={`input-field ${errors.customDateTime ? 'border-red-500' : ''}`}
                      />
                      {errors.customDateTime && <p className="text-red-600 text-sm mt-1">{errors.customDateTime}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Passenger Details */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <span>👤</span><span>Your Details</span>
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="customerName" className="label">Your full name *</label>
                    <input
                      type="text" id="customerName" name="customerName"
                      value={formData.customerName} onChange={handleChange}
                      placeholder="e.g., Fatou Jammeh"
                      className={`input-field ${errors.customerName ? 'border-red-500' : ''}`}
                    />
                    {errors.customerName && <p className="text-red-600 text-sm mt-1">{errors.customerName}</p>}
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="label">Phone number *</label>
                    <input
                      type="tel" id="phoneNumber" name="phoneNumber"
                      value={formData.phoneNumber} onChange={handleChange}
                      placeholder="e.g., 2207654321 or 7654321"
                      className={`input-field ${errors.phoneNumber ? 'border-red-500' : ''}`}
                    />
                    {errors.phoneNumber && <p className="text-red-600 text-sm mt-1">{errors.phoneNumber}</p>}
                    <p className="text-sm text-gray-500 mt-1">We'll call you when your driver is assigned</p>
                  </div>

                  <div>
                    <label htmlFor="notes" className="label">Special requests (optional)</label>
                    <textarea
                      id="notes" name="notes" value={formData.notes} onChange={handleChange}
                      placeholder="e.g., Please call when you arrive, I have luggage"
                      rows={3} className="input-field resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <span>💳</span><span>Payment</span>
                </h2>
                <PaymentMethodSelector
                  selectedMethod={formData.paymentMethod === 'mobile_money' ? 'mobile-money' : 'cash'}
                  onSelect={(method) => setFormData(prev => ({
                    ...prev,
                    paymentMethod: method === 'mobile-money' ? 'mobile_money' : 'cash'
                  }))}
                />
              </div>

              {/* Error */}
              {submitError && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                  <p className="text-red-800 text-sm">{submitError}</p>
                </div>
              )}

              {/* Submit */}
              <div className="border-t border-gray-200 pt-6">
                <button
                  type="submit" disabled={isSubmitting}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <><span className="animate-spin">⏳</span><span>Submitting...</span></>
                  ) : (
                    <><span>Confirm Booking</span><span>→</span></>
                  )}
                </button>
                <p className="text-center text-sm text-gray-500 mt-4">
                  By booking, you agree to our terms of service and payment policy
                </p>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {estimatedFare > 0 ? (
                <FareEstimateCard
                  fare={estimatedFare}
                  pickup={formData.pickupLocation}
                  dropoff={formData.dropoffLocation}
                />
              ) : (
                <div className="card bg-gray-50 text-center">
                  <div className="text-6xl mb-4">🚕</div>
                  <h3 className="font-bold text-lg text-gray-700 mb-2">Estimated Fare</h3>
                  <p className="text-gray-600 text-sm">
                    Enter your pickup and drop-off locations to see the estimated fare
                  </p>
                </div>
              )}
              <div className="mt-6 bg-white rounded-xl p-4 shadow-md border-2 border-green-200">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Safe & Secure</h4>
                    <p className="text-sm text-gray-600">All drivers are verified. Your booking is confirmed instantly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { BookingData } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';

interface BookingSummaryCardProps {
  booking: BookingData;
}

export default function BookingSummaryCard({ booking }: BookingSummaryCardProps) {
  return (
    <div className="card">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-4 shadow-lg">
          <span className="text-4xl">✓</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Booking Confirmed!
        </h2>
        <p className="text-gray-600">
          Your booking request has been received
        </p>
      </div>

      {/* Booking Reference */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
        <p className="text-sm text-gray-600 mb-1">Booking Reference</p>
        <p className="text-2xl font-bold text-primary-700 tracking-wider">
          {booking.id}
        </p>
      </div>

      {/* Status */}
      <div className="mb-6 text-center">
        <StatusBadge status={booking.status} />
        <p className="text-sm text-gray-600 mt-3">
          We are assigning a driver to your trip. You will receive a call shortly.
        </p>
      </div>

      {/* Trip Details */}
      <div className="space-y-4 border-t border-gray-200 pt-6">
        <h3 className="font-bold text-gray-900 mb-4">Trip Details</h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <span className="text-green-600 text-xl mt-1">🟢</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">Pickup Location</p>
              <p className="text-gray-900">{booking.pickupLocation}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <span className="text-red-600 text-xl mt-1">🔴</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">Drop-off Location</p>
              <p className="text-gray-900">{booking.dropoffLocation}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <span className="text-xl mt-1">🕐</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">Pickup Time</p>
              <p className="text-gray-900">{booking.pickupTime}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <span className="text-xl mt-1">👤</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">Passenger</p>
              <p className="text-gray-900">{booking.customerName}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <span className="text-xl mt-1">📱</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">Phone Number</p>
              <p className="text-gray-900">{booking.phoneNumber}</p>
            </div>
          </div>

          {booking.notes && (
            <div className="flex items-start space-x-3">
              <span className="text-xl mt-1">📝</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">Notes</p>
                <p className="text-gray-900">{booking.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="font-bold text-gray-900 mb-4">Payment Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Estimated Fare</span>
            <span className="font-bold text-xl text-gray-900">
              {formatCurrency(booking.estimatedFare)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Payment Method</span>
            <span className="font-semibold text-gray-900 flex items-center space-x-2">
              <span>{booking.paymentMethod === 'mobile-money' ? '📱' : '💵'}</span>
              <span>
                {booking.paymentMethod === 'mobile-money' ? 'Mobile Money' : 'Cash'}
              </span>
            </span>
          </div>

          {booking.paymentMethod === 'mobile-money' && (
            <div className="bg-blue-50 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Payment Instructions:</strong> Our driver will send you mobile money payment request when they arrive.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Important Note */}
      <div className="bg-accent-50 border-l-4 border-accent-400 rounded-lg p-4 mt-6">
        <p className="text-sm text-gray-800">
          <strong>📞 Important:</strong> Please keep your phone nearby. Our driver will contact you when they are on the way.
        </p>
      </div>
    </div>
  );
}

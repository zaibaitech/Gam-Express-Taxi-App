import { formatCurrency } from '@/lib/utils';

interface FareEstimateCardProps {
  fare: number;
  pickup?: string;
  dropoff?: string;
}

export default function FareEstimateCard({ fare, pickup, dropoff }: FareEstimateCardProps) {
  return (
    <div className="card bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800">Estimated Fare</h3>
        <span className="text-2xl">💰</span>
      </div>
      
      <div className="text-center py-4">
        <div className="text-4xl font-bold text-primary-700 mb-2">
          {formatCurrency(fare)}
        </div>
        <p className="text-sm text-gray-600">
          Final fare may vary based on actual distance and time
        </p>
      </div>

      {pickup && dropoff && (
        <div className="mt-4 pt-4 border-t border-primary-200">
          <div className="space-y-2 text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-green-600 font-bold mt-0.5">🟢</span>
              <div>
                <p className="font-semibold text-gray-700">Pickup</p>
                <p className="text-gray-600">{pickup}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-red-600 font-bold mt-0.5">🔴</span>
              <div>
                <p className="font-semibold text-gray-700">Drop-off</p>
                <p className="text-gray-600">{dropoff}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

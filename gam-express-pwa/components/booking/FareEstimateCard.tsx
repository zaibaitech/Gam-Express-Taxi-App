import { calculateFareEstimate, formatCurrency } from '@/lib/utils';

interface FareEstimateCardProps {
  readonly fare: number;
  readonly pickup?: string;
  readonly dropoff?: string;
}

export default function FareEstimateCard({ fare, pickup, dropoff }: FareEstimateCardProps) {
  const estimate = pickup && dropoff
    ? calculateFareEstimate(pickup, dropoff)
    : null;

  if (!fare || fare === 0) {
    return (
      <div className="card bg-gray-50 border-2 border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-800">Fare Estimate</h3>
          <span className="text-2xl">🚕</span>
        </div>
        <p className="text-sm text-gray-500">
          Enter pickup and drop-off to see the estimated fare.
        </p>
      </div>
    );
  }

  return (
    <div className="card bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800">Fare Estimate</h3>
        <div className="flex items-center gap-2">
          {estimate?.isSurge && (
            <span className="text-xs font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
              ⚡ Peak hours
            </span>
          )}
          <span className="text-2xl">🚕</span>
        </div>
      </div>

      {/* Price range — headline */}
      <div className="text-center py-3">
        {estimate ? (
          <>
            <div className="text-3xl font-bold text-yellow-700">
              {formatCurrency(estimate.low)} – {formatCurrency(estimate.high)}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Typical fare · {estimate.km === null ? 'distance estimated' : `${estimate.km.toFixed(1)} km`}
            </p>
          </>
        ) : (
          <div className="text-3xl font-bold text-yellow-700">
            {formatCurrency(fare)}
          </div>
        )}
      </div>

      {/* Breakdown */}
      {estimate && (
        <div className="mt-3 pt-3 border-t border-yellow-200 grid grid-cols-3 text-center text-xs text-gray-600 gap-2">
          <div>
            <p className="font-semibold text-gray-800">Base</p>
            <p>GMD 250</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800">Per km</p>
            <p>GMD 60</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800">Per min</p>
            <p>GMD 10</p>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 text-center">
        Final fare agreed with driver · Cash or Mobile Money
      </p>
    </div>
  );
}

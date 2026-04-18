import { Feature } from '@/types';

interface FeatureGridProps {
  features: Feature[];
}

export default function FeatureGrid({ features }: FeatureGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((feature, index) => (
        <div 
          key={index}
          className="card hover:shadow-xl transition-shadow duration-300 text-center"
        >
          <div className="text-5xl mb-4">{feature.icon}</div>
          <h3 className="font-bold text-lg text-gray-900 mb-2">
            {feature.title}
          </h3>
          <p className="text-gray-600 text-sm">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}

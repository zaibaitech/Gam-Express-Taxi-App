'use client';

import { useState } from 'react';

interface PaymentMethodSelectorProps {
  selectedMethod: 'mobile-money' | 'cash';
  onSelect: (method: 'mobile-money' | 'cash') => void;
}

export default function PaymentMethodSelector({ 
  selectedMethod, 
  onSelect 
}: PaymentMethodSelectorProps) {
  const methods = [
    {
      id: 'mobile-money' as const,
      name: 'Mobile Money',
      description: 'QCell, Africell, or Comium',
      icon: '📱',
      recommended: true,
      benefits: 'Faster confirmation • Secure • Instant receipt',
    },
    {
      id: 'cash' as const,
      name: 'Cash on Pickup',
      description: 'Pay the driver directly',
      icon: '💵',
      recommended: false,
      benefits: 'Pay when you enter the taxi',
    },
  ];

  return (
    <div className="space-y-3">
      <label className="label">
        Payment Method
      </label>
      
      {methods.map((method) => (
        <button
          key={method.id}
          type="button"
          onClick={() => onSelect(method.id)}
          className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
            selectedMethod === method.id
              ? 'border-primary-500 bg-primary-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-primary-300'
          }`}
        >
          <div className="flex items-start space-x-3">
            <span className="text-3xl">{method.icon}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900">{method.name}</h4>
                {method.recommended && (
                  <span className="text-xs bg-accent-400 text-white px-2 py-1 rounded-full font-semibold">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{method.description}</p>
              <p className="text-xs text-primary-700 mt-2 font-medium">
                {method.benefits}
              </p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              selectedMethod === method.id
                ? 'border-primary-500 bg-primary-500'
                : 'border-gray-300'
            }`}>
              {selectedMethod === method.id && (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export interface BookingData {
  id?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  customerName: string;
  phoneNumber: string;
  notes?: string;
  estimatedFare: number;
  paymentMethod: 'mobile-money' | 'cash';
  status: 'pending' | 'confirmed' | 'assigned' | 'completed' | 'cancelled';
  createdAt?: Date;
}

export interface Feature {
  title: string;
  description: string;
  icon: string;
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

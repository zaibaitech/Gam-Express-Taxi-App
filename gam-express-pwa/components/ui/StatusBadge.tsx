interface StatusBadgeProps {
  status: 'pending' | 'confirmed' | 'assigned' | 'completed' | 'cancelled';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: 'Waiting for Confirmation',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      icon: '⏳',
    },
    confirmed: {
      label: 'Confirmed',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      icon: '✓',
    },
    assigned: {
      label: 'Driver Assigned',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: '🚕',
    },
    completed: {
      label: 'Completed',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      icon: '✓',
    },
    cancelled: {
      label: 'Cancelled',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: '✕',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${config.bgColor}`}>
      <span className="text-lg">{config.icon}</span>
      <span className={`font-semibold text-sm ${config.textColor}`}>
        {config.label}
      </span>
    </div>
  );
}

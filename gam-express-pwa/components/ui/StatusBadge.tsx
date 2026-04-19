type LiveStatus = 'pending' | 'accepted' | 'en_route' | 'arrived' | 'completed' | 'cancelled';

interface StatusBadgeProps {
  status: LiveStatus;
}

const STATUS_CONFIG: Record<LiveStatus, { label: string; bgColor: string; textColor: string; icon: string }> = {
  pending:   { label: 'Waiting for Confirmation', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', icon: '⏳' },
  accepted:  { label: 'Driver Assigned',           bgColor: 'bg-blue-100',   textColor: 'text-blue-800',   icon: '🚕' },
  en_route:  { label: 'Driver On The Way',         bgColor: 'bg-blue-100',   textColor: 'text-blue-800',   icon: '🚗' },
  arrived:   { label: 'Driver Arrived',            bgColor: 'bg-purple-100', textColor: 'text-purple-800', icon: '📍' },
  completed: { label: 'Ride Completed',            bgColor: 'bg-green-100',  textColor: 'text-green-800',  icon: '✅' },
  cancelled: { label: 'Cancelled',                 bgColor: 'bg-red-100',    textColor: 'text-red-800',    icon: '✕' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  return (
    <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${config.bgColor}`}>
      <span className="text-lg">{config.icon}</span>
      <span className={`font-semibold text-sm ${config.textColor}`}>
        {config.label}
      </span>
    </div>
  );
}

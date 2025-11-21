export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    eventsLimit: 3,
    storageLimit: 1073741824, // 1GB
    color: 'var(--purple-500)'
  },
  basic: {
    name: 'Basic',
    eventsLimit: 10,
    storageLimit: 10737418240, // 10GB
    price: '$19/month',
    color: 'var(--pink-500)'
  },
  premium: {
    name: 'Premium',
    eventsLimit: -1, // Unlimited
    storageLimit: 53687091200, // 50GB
    price: '$49/month',
    color: 'var(--purple-600)'
  }
};

export const EVENT_STATUS = {
  upcoming: { label: 'Upcoming', color: 'var(--info)' },
  active: { label: 'Active', color: 'var(--success)' },
  completed: { label: 'Completed', color: 'var(--gray-500)' }
};

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

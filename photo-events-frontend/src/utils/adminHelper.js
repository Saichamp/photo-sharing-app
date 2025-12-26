/**
 * Admin Helper Utilities
 * Helper functions for admin panel
 */

/**
 * Check if user is admin and redirect if not
 */
export const requireAdmin = (navigate) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    navigate('/login');
    return false;
  }

  try {
    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error parsing user data:', err);
    navigate('/login');
    return false;
  }
};

/**
 * Format number with commas (handles undefined/null)
 */
export const formatNumber = (num) => {
  // Handle undefined, null, or invalid values
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }
  
  // Convert to number if it's a string
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  // Check again after conversion
  if (isNaN(number)) {
    return '0';
  }
  
  return number.toLocaleString();
};

/**
 * Format bytes to human readable format (handles undefined/null)
 */
export const formatBytes = (bytes) => {
  // Handle undefined, null, or invalid values
  if (bytes === undefined || bytes === null || isNaN(bytes)) {
    return '0 B';
  }

  // Convert to number if it's a string
  const numBytes = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  
  // Check again after conversion
  if (isNaN(numBytes) || numBytes === 0) {
    return '0 B';
  }

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(numBytes) / Math.log(1024));
  const value = numBytes / Math.pow(1024, i);
  
  return `${value.toFixed(2)} ${sizes[i]}`;
};

/**
 * Get user status badge configuration
 */
export const getUserStatusBadge = (isActive) => {
  return isActive
    ? { text: 'Active', className: 'badge-success' }
    : { text: 'Inactive', className: 'badge-danger' };
};

/**
 * Get subscription plan badge configuration
 */
export const getPlanBadge = (plan) => {
  const badges = {
    free: { text: 'Free', className: 'badge-secondary' },
    basic: { text: 'Basic', className: 'badge-info' },
    premium: { text: 'Premium', className: 'badge-warning' },
    enterprise: { text: 'Enterprise', className: 'badge-primary' }
  };
  return badges[plan] || badges.free;
};

/**
 * Get role badge configuration
 */
export const getRoleBadge = (role) => {
  const badges = {
    admin: { text: 'Admin', className: 'badge-primary' },
    organizer: { text: 'Organizer', className: 'badge-info' }
  };
  return badges[role] || badges.organizer;
};

/**
 * Format date to readable string
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (err) {
    return 'Invalid Date';
  }
};

/**
 * Format date and time to readable string
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  
  try {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (err) {
    return 'Invalid Date';
  }
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date) => {
  if (!date) return 'Unknown';
  
  try {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return formatDate(date);
  } catch (err) {
    return 'Unknown';
  }
};

/**
 * Calculate percentage safely
 */
export const calculatePercentage = (value, total) => {
  if (!total || total === 0 || !value) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Get status color class
 */
export const getStatusColor = (status) => {
  const colors = {
    active: 'status-success',
    inactive: 'status-danger',
    pending: 'status-warning',
    completed: 'status-info',
    cancelled: 'status-secondary'
  };
  return colors[status] || 'status-secondary';
};

/**
 * Check if value is empty or undefined
 */
export const isEmpty = (value) => {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  );
};

/**
 * Safe JSON parse
 */
export const safeJSONParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch (err) {
    console.error('JSON Parse Error:', err);
    return fallback;
  }
};

/**
 * Generate random color for avatars
 */
export const getRandomColor = () => {
  const colors = [
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#4facfe',
    '#43e97b',
    '#fa709a',
    '#fee140',
    '#30cfd0'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Download data as JSON file
 */
export const downloadJSON = (data, filename = 'data.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Download data as CSV file
 */
export const downloadCSV = (data, filename = 'data.csv') => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Copy failed:', err);
    return false;
  }
};

/**
 * Debounce function
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

// ✅ FIXED: Assign to variable before exporting
const adminHelpers = {
  requireAdmin,
  formatNumber,
  formatBytes,
  getUserStatusBadge,
  getPlanBadge,
  getRoleBadge,
  formatDate,
  formatDateTime,
  getRelativeTime,
  calculatePercentage,
  truncateText,
  getStatusColor,
  isEmpty,
  safeJSONParse,
  getRandomColor,
  downloadJSON,
  downloadCSV,
  copyToClipboard,
  debounce,
  getInitials
};

export default adminHelpers;

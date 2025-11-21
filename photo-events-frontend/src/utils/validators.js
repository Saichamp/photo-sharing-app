export const validators = {
  email: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  password: (password) => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  },

  name: (name) => {
    return name && name.trim().length >= 2 && name.trim().length <= 50;
  },

  phone: (phone) => {
    const regex = /^[+]?[\d\s\-()]{10,}$/;
    return regex.test(phone);
  }
};

export const getPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  if (strength <= 2) return { level: 'weak', color: 'var(--error)' };
  if (strength <= 4) return { level: 'medium', color: 'var(--warning)' };
  return { level: 'strong', color: 'var(--success)' };
};

export const getPhoneDigits = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 15);
};

export const formatPhoneMask = (value: string): string => {
  const digits = getPhoneDigits(value);
  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 10);
  const extension = digits.slice(10);

  if (digits.length <= 3) return part1;
  if (digits.length <= 6) return `${part1}-${part2}`;
  if (digits.length <= 10) return `${part1}-${part2}-${part3}`;
  return `${part1}-${part2}-${part3} ${extension}`;
};

export const isValidPhone = (value: string): boolean => {
  const digits = getPhoneDigits(value);
  return digits.length >= 10 && digits.length <= 15;
};

export const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

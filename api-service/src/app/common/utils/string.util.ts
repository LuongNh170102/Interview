export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // split accented letters into base letter and diacritical mark
    .replace(/[\u0300-\u036f]/g, '') // remove diacritical marks
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/[^\w\-]+/g, '') // remove special characters
    .replace(/\-\-+/g, '-') // replace multiple hyphens with a single hyphen
    .replace(/^-+/, '') // remove hyphens from the start
    .replace(/-+$/, ''); // remove hyphens from the end
}

/**
 * Generate a secure temporary password for admin-created accounts.
 * The user should change this password on first login.
 * @param length - Length of password (default: 12)
 * @returns Random password string
 */
export function generateTempPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ============================================
// Validation Utilities
// ============================================

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Minimum 6 characters
 */
export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Validate store slug (for URLs)
 * Only lowercase letters, numbers, and hyphens
 */
export function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
}

/**
 * Sanitize slug from store name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 50); // Limit length
}

/**
 * Validate reference number format
 */
export function validateReferenceNumber(ref: string): boolean {
  // Allow alphanumeric and some special characters
  return /^[A-Z0-9-]+$/i.test(ref) && ref.length >= 3 && ref.length <= 50;
}


/**
 * Generates a unique product reference code
 * Format: [CATEGORY_PREFIX]-[RANDOM_STRING]
 * Example: VASE-A7B9, BOWL-X2K4, PLATE-M8N3
 */

const CATEGORY_PREFIXES: { [key: string]: string } = {
  'Vase': 'VASE',
  'Bowls': 'BOWL', 
  'Plates': 'PLATE',
  'Mugs': 'MUG',
  'Cups': 'CUP',
  'Sculpture': 'SCULPT',
  'Decorative': 'DECOR',
  'Bowl': 'BOWL',
  'Plate': 'PLATE',
  'Mug': 'MUG',
  'Cup': 'CUP'
};

/**
 * Generates a random alphanumeric string
 * @param length - Length of the random string (default: 4)
 * @returns Random string with letters and numbers
 */
function generateRandomString(length: number = 4): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Gets the category prefix for a given category name
 * @param categoryName - Name of the category
 * @returns Category prefix or 'ITEM' as fallback
 */
function getCategoryPrefix(categoryName: string): string {
  return CATEGORY_PREFIXES[categoryName] || 'ITEM';
}

/**
 * Generates a unique product reference code
 * @param categoryName - Name of the product category
 * @param existingReferences - Array of existing reference codes to avoid duplicates
 * @returns Unique reference code
 */
export function generateProductReference(
  categoryName: string, 
  existingReferences: string[] = []
): string {
  const prefix = getCategoryPrefix(categoryName);
  let reference: string;
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loops

  do {
    const randomString = generateRandomString();
    reference = `${prefix}-${randomString}`;
    attempts++;
  } while (existingReferences.includes(reference) && attempts < maxAttempts);

  // If we still have a duplicate after max attempts, add a timestamp
  if (existingReferences.includes(reference)) {
    const timestamp = Date.now().toString().slice(-4);
    reference = `${prefix}-${timestamp}`;
  }

  return reference;
}

/**
 * Validates if a reference code is in the correct format
 * @param reference - Reference code to validate
 * @returns True if valid format, false otherwise
 */
export function isValidReferenceFormat(reference: string): boolean {
  const pattern = /^[A-Z]+-[A-Z0-9]+$/;
  return pattern.test(reference);
}

/**
 * Extracts the category prefix from a reference code
 * @param reference - Reference code
 * @returns Category prefix or null if invalid format
 */
export function extractCategoryFromReference(reference: string): string | null {
  if (!isValidReferenceFormat(reference)) {
    return null;
  }
  return reference.split('-')[0];
}

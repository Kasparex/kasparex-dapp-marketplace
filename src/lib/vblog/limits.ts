/**
 * vBlog content limits and validation
 */

export const CONTENT_LIMITS = {
  // Standard limits
  title: {
    min: 5,
    max: 100,
  },
  description: {
    min: 20,
    max: 300,
  },
  content: {
    min: 100,
    max: 10000,
  },
  // Premium limits (for NFT holders)
  premium: {
    title: {
      min: 5,
      max: 150,
    },
    description: {
      min: 20,
      max: 500,
    },
    content: {
      min: 100,
      max: 20000,
    },
  },
} as const;

export const FILE_LIMITS = {
  maxSize: 10 * 1024 * 1024, // 10 MB
  allowedTypes: ['.txt', '.md', '.json', '.html'],
} as const;

export function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function getCharacterCount(text: string): number {
  return text.trim().length;
}

export function validateTitle(title: string, isPremium: boolean = false): { valid: boolean; error?: string } {
  const limits = isPremium ? CONTENT_LIMITS.premium.title : CONTENT_LIMITS.title;
  const charCount = getCharacterCount(title);
  
  if (charCount < limits.min) {
    return { valid: false, error: `Title must be at least ${limits.min} characters` };
  }
  if (charCount > limits.max) {
    return { valid: false, error: `Title must be no more than ${limits.max} characters` };
  }
  return { valid: true };
}

export function validateDescription(description: string, isPremium: boolean = false): { valid: boolean; error?: string } {
  const limits = isPremium ? CONTENT_LIMITS.premium.description : CONTENT_LIMITS.description;
  const charCount = getCharacterCount(description);
  
  if (charCount < limits.min) {
    return { valid: false, error: `Description must be at least ${limits.min} characters` };
  }
  if (charCount > limits.max) {
    return { valid: false, error: `Description must be no more than ${limits.max} characters` };
  }
  return { valid: true };
}

export function validateContent(content: string, isPremium: boolean = false): { valid: boolean; error?: string } {
  const limits = isPremium ? CONTENT_LIMITS.premium.content : CONTENT_LIMITS.content;
  const charCount = getCharacterCount(content);
  
  if (charCount < limits.min) {
    return { valid: false, error: `Content must be at least ${limits.min} characters` };
  }
  if (charCount > limits.max) {
    return { valid: false, error: `Content must be no more than ${limits.max} characters` };
  }
  return { valid: true };
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > FILE_LIMITS.maxSize) {
    return { valid: false, error: `File size must be no more than ${FILE_LIMITS.maxSize / (1024 * 1024)} MB` };
  }
  
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!FILE_LIMITS.allowedTypes.includes(extension)) {
    return { valid: false, error: `File type not allowed. Allowed types: ${FILE_LIMITS.allowedTypes.join(', ')}` };
  }
  
  return { valid: true };
}


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
  maxSize: 5 * 1024 * 1024, // 5 MB
  allowedTypes: ['.txt', '.md', '.json', '.html'],
} as const;

export const IMAGE_LIMITS = {
  maxSize: 5 * 1024 * 1024, // 5 MB
  allowedTypes: ['.jpg', '.jpeg', '.png'],
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
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
  // Strip HTML tags for character counting
  const textContent = content.replace(/<[^>]*>/g, '');
  const charCount = getCharacterCount(textContent);
  
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
  
  const lastDot = file.name.lastIndexOf('.');
  if (lastDot === -1) {
    return { valid: false, error: `File type not allowed. Allowed types: ${FILE_LIMITS.allowedTypes.join(', ')}` };
  }
  
  const extension = ('.' + file.name.substring(lastDot + 1).toLowerCase()) as typeof FILE_LIMITS.allowedTypes[number];
  if (!FILE_LIMITS.allowedTypes.includes(extension)) {
    return { valid: false, error: `File type not allowed. Allowed types: ${FILE_LIMITS.allowedTypes.join(', ')}` };
  }
  
  return { valid: true };
}

export function validateImage(file: File): { valid: boolean; error?: string } {
  if (file.size > IMAGE_LIMITS.maxSize) {
    return { valid: false, error: `Image size must be no more than ${IMAGE_LIMITS.maxSize / (1024 * 1024)} MB` };
  }
  
  // Check MIME type first (more reliable)
  const mimeType = file.type.toLowerCase() as typeof IMAGE_LIMITS.allowedMimeTypes[number];
  if (!IMAGE_LIMITS.allowedMimeTypes.includes(mimeType)) {
    return { valid: false, error: `Image type not allowed. Allowed types: ${IMAGE_LIMITS.allowedTypes.join(', ')}` };
  }
  
  // Also check file extension as fallback
  const lastDot = file.name.lastIndexOf('.');
  if (lastDot === -1) {
    return { valid: false, error: `Image type not allowed. Allowed types: ${IMAGE_LIMITS.allowedTypes.join(', ')}` };
  }
  
  const extension = ('.' + file.name.substring(lastDot + 1).toLowerCase()) as typeof IMAGE_LIMITS.allowedTypes[number];
  if (!IMAGE_LIMITS.allowedTypes.includes(extension)) {
    return { valid: false, error: `Image type not allowed. Allowed types: ${IMAGE_LIMITS.allowedTypes.join(', ')}` };
  }
  
  return { valid: true };
}

export function getFileSizeDisplay(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


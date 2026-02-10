const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10') * 1024 * 1024

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateImageFile(file: File): ValidationResult {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024)
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`
    }
  }

  return { valid: true }
}

export function validateBatchUpload(files: File[]): ValidationResult {
  const maxImages = parseInt(process.env.MAX_IMAGES_PER_USER || '20')

  if (files.length > maxImages) {
    return {
      valid: false,
      error: `Too many files. Maximum: ${maxImages} images`
    }
  }

  for (const file of files) {
    const result = validateImageFile(file)
    if (!result.valid) {
      return result
    }
  }

  return { valid: true }
}

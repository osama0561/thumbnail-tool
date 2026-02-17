import { GoogleGenerativeAI } from '@google/generative-ai'

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }
  return new GoogleGenerativeAI(apiKey)
}

export const GEMINI_MODELS = {
  FLASH: 'gemini-2.0-flash',
  IMAGE_GEN: 'gemini-2.5-flash-preview-04-17',
  IMAGEN: 'imagen-3.0-generate-001',
}

// Retry logic with exponential backoff
export async function callGeminiWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      if (error.status === 429 && i < maxRetries - 1) {
        const backoffMs = Math.pow(2, i) * 1000 + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

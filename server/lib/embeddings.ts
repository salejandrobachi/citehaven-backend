import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

const EMBEDDING_MODEL = 'gemini-embedding-001'

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: {
      outputDimensionality: 768,
      taskType: 'RETRIEVAL_DOCUMENT'
    }
  })

  const values = result.embeddings?.[0]?.values
  if (!values) throw new Error('No se pudo generar el embedding.')

  return values
}
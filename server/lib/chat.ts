import { GoogleGenAI } from '@google/genai'
import type { SearchResult } from './semantic-search.js'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

const CHAT_MODEL = 'gemini-3.5-flash'

export interface ChatResponse {
  answer: string
  confidenceScore: number
  sources: Array<{
    filename: string
    excerpt: string
    similarity: number
  }>
}

export async function chatWithDocuments(
  query: string,
  searchResults: SearchResult[]
): Promise<ChatResponse> {
  if (searchResults.length === 0) {
    return {
      answer: 'No encontré información relevante en tus documentos para responder esta pregunta.',
      confidenceScore: 0,
      sources: []
    }
  }

  const context = searchResults
    .map((r, i) => `[Fuente ${i + 1} - ${r.filename}]:\n${r.content}`)
    .join('\n\n---\n\n')

  const confidenceScore =
    searchResults.reduce((sum, r) => sum + r.similarity, 0) / searchResults.length

  const prompt = `Eres un asistente que responde preguntas ÚNICAMENTE basándose en los fragmentos de documentos proporcionados.

REGLAS:
- Responde SOLO con información que esté explícitamente en los fragmentos.
- Si la información no está en los fragmentos, dilo claramente.
- Cita las fuentes usando [Fuente N] al final de cada afirmación relevante.
- Si la confianza es baja (los fragmentos no son muy relevantes), indícalo explícitamente.
- Responde en el mismo idioma en que se hace la pregunta.

FRAGMENTOS DE DOCUMENTOS:
${context}

PREGUNTA: ${query}

RESPUESTA:`

  const result = await ai.models.generateContent({
    model: CHAT_MODEL,
    contents: prompt
  })

  const answer = result.text ?? 'No se pudo generar una respuesta.'

  return {
    answer,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    sources: searchResults.map(r => ({
      filename: r.filename,
      excerpt: r.content.slice(0, 200) + (r.content.length > 200 ? '...' : ''),
      similarity: Math.round(r.similarity * 100) / 100
    }))
  }
}
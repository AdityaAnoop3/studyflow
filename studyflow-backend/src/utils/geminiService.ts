import { GoogleGenerativeAI } from '@google/generative-ai'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import fs from 'fs/promises'

// Initialize Gemini - You'll need to get a free API key from https://makersuite.google.com/app/apikey
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

interface GeneratedProblem {
  question: string
  answer: string
  difficulty: number
}

export class GeminiService {
  async extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
    try {
      if (mimeType === 'application/pdf') {
        const dataBuffer = await fs.readFile(filePath)
        const data = await pdf(dataBuffer)
        return data.text
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const data = await fs.readFile(filePath)
        const result = await mammoth.extractRawText({ buffer: data })
        return result.value
      } else {
        throw new Error('Unsupported file type')
      }
    } catch (error) {
      console.error('Error extracting text:', error)
      throw new Error('Failed to extract text from file')
    }
  }

  async generateProblems(
    text: string, 
    subject: string, 
    count: number = 5,
    difficultyRange: { min: number, max: number } = { min: 1, max: 5 }
  ): Promise<GeneratedProblem[]> {
    try {
      const prompt = `
You are an expert educator creating practice problems for students.

Based on the following lecture material about ${subject}, generate ${count} practice problems.

LECTURE MATERIAL:
${text.substring(0, 4000)} // Limit text to avoid token limits

REQUIREMENTS:
1. Create ${count} diverse problems that test understanding of the key concepts
2. Include a mix of difficulty levels from ${difficultyRange.min} to ${difficultyRange.max} (1=easy, 5=hard)
3. Problems should be clear and unambiguous
4. Answers should be concise but complete
5. Focus on conceptual understanding, not just memorization

FORMAT YOUR RESPONSE EXACTLY AS JSON:
{
  "problems": [
    {
      "question": "Clear question text here",
      "answer": "Complete answer here",
      "difficulty": 3,
      "explanation": "Brief explanation of why this difficulty level"
    }
  ]
}

Generate the problems now:`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const responseText = response.text()
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response')
      }
      
      const parsed = JSON.parse(jsonMatch[0])
      
      // Map to our format
      return parsed.problems.map((p: any) => ({
        question: p.question,
        answer: p.answer,
        difficulty: Math.min(5, Math.max(1, p.difficulty))
      }))
    } catch (error) {
      console.error('Error generating problems:', error)
      throw new Error('Failed to generate problems')
    }
  }

  async generateProblemsFromFile(
    filePath: string,
    mimeType: string,
    subject: string,
    count: number = 5
  ): Promise<GeneratedProblem[]> {
    // Extract text from file
    const text = await this.extractTextFromFile(filePath, mimeType)
    
    if (!text || text.length < 100) {
      throw new Error('Insufficient content in file to generate problems')
    }
    
    // Generate problems from text
    return this.generateProblems(text, subject, count)
  }
}

export const geminiService = new GeminiService()
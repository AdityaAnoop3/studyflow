import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { geminiService } from '../utils/geminiService'
import fs from 'fs/promises'

const prisma = new PrismaClient()

interface AuthRequest extends Request {
  userId?: string
}

export const createProblemSet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const problemSet = await prisma.problemSet.create({
      data: {
        title,
        description,
        userId
      },
      include: {
        _count: {
          select: { problems: true }
        }
      }
    })

    res.status(201).json(problemSet)
  } catch (error) {
    console.error('Create problem set error:', error)
    res.status(500).json({ message: 'Failed to create problem set' })
  }
}

export const getUserProblemSets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const problemSets = await prisma.problemSet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { problems: true }
        }
      }
    })

    res.json(problemSets)
  } catch (error) {
    console.error('Get problem sets error:', error)
    res.status(500).json({ message: 'Failed to fetch problem sets' })
  }
}

export const getProblemSetById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const problemSet = await prisma.problemSet.findFirst({
      where: { id, userId },
      include: {
        problems: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!problemSet) {
      res.status(404).json({ message: 'Problem set not found' })
      return
    }

    res.json(problemSet)
  } catch (error) {
    console.error('Get problem set error:', error)
    res.status(500).json({ message: 'Failed to fetch problem set' })
  }
}

export const updateProblemSet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { title, description } = req.body
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const problemSet = await prisma.problemSet.findFirst({
      where: { id, userId }
    })

    if (!problemSet) {
      res.status(404).json({ message: 'Problem set not found' })
      return
    }

    const updated = await prisma.problemSet.update({
      where: { id },
      data: { title, description },
      include: {
        _count: {
          select: { problems: true }
        }
      }
    })

    res.json(updated)
  } catch (error) {
    console.error('Update problem set error:', error)
    res.status(500).json({ message: 'Failed to update problem set' })
  }
}

export const deleteProblemSet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const problemSet = await prisma.problemSet.findFirst({
      where: { id, userId }
    })

    if (!problemSet) {
      res.status(404).json({ message: 'Problem set not found' })
      return
    }

    await prisma.problemSet.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete problem set error:', error)
    res.status(500).json({ message: 'Failed to delete problem set' })
  }
}

// Problem management within sets
export const addProblem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { problemSetId } = req.params
    const { question, answer, difficulty } = req.body
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    // Verify ownership of problem set
    const problemSet = await prisma.problemSet.findFirst({
      where: { id: problemSetId, userId }
    })

    if (!problemSet) {
      res.status(404).json({ message: 'Problem set not found' })
      return
    }

    const problem = await prisma.problem.create({
      data: {
        problemSetId,
        question,
        answer,
        difficulty: difficulty || 3
      }
    })

    res.status(201).json(problem)
  } catch (error) {
    console.error('Add problem error:', error)
    res.status(500).json({ message: 'Failed to add problem' })
  }
}

export const updateProblem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { problemSetId, problemId } = req.params
    const { question, answer, difficulty } = req.body
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    // Verify ownership
    const problemSet = await prisma.problemSet.findFirst({
      where: { id: problemSetId, userId }
    })

    if (!problemSet) {
      res.status(404).json({ message: 'Problem set not found' })
      return
    }

    const problem = await prisma.problem.update({
      where: { id: problemId },
      data: { question, answer, difficulty }
    })

    res.json(problem)
  } catch (error) {
    console.error('Update problem error:', error)
    res.status(500).json({ message: 'Failed to update problem' })
  }
}

export const deleteProblem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { problemSetId, problemId } = req.params
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    // Verify ownership
    const problemSet = await prisma.problemSet.findFirst({
      where: { id: problemSetId, userId }
    })

    if (!problemSet) {
      res.status(404).json({ message: 'Problem set not found' })
      return
    }

    await prisma.problem.delete({
      where: { id: problemId }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete problem error:', error)
    res.status(500).json({ message: 'Failed to delete problem' })
  }
}

export const recordAttempt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { problemId } = req.params
    const { success } = req.body
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    // Verify the problem exists and user owns the problem set
    const problem = await prisma.problem.findFirst({
      where: { 
        id: problemId,
        problemSet: { userId }
      }
    })

    if (!problem) {
      res.status(404).json({ message: 'Problem not found' })
      return
    }

    // Update problem statistics
    const updated = await prisma.problem.update({
      where: { id: problemId },
      data: {
        attempts: { increment: 1 },
        successes: success ? { increment: 1 } : undefined,
        lastAttempt: new Date()
      }
    })

    res.json({
      ...updated,
      successRate: updated.attempts > 0 ? (updated.successes / updated.attempts * 100).toFixed(1) : 0
    })
  } catch (error) {
    console.error('Record attempt error:', error)
    res.status(500).json({ message: 'Failed to record attempt' })
  }
}

// Generate problems from uploaded file using AI
export const generateProblemsFromFile = async (req: AuthRequest & { file?: Express.Multer.File }, res: Response): Promise<void> => {
  try {
    const { problemSetId } = req.params
    const { subject, count = 5 } = req.body
    const userId = req.userId
    const file = req.file

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    if (!file) {
      res.status(400).json({ message: 'No file uploaded' })
      return
    }

    // Verify ownership of problem set
    const problemSet = await prisma.problemSet.findFirst({
      where: { id: problemSetId, userId }
    })

    if (!problemSet) {
      res.status(404).json({ message: 'Problem set not found' })
      return
    }

    // Generate problems using Gemini
    const generatedProblems = await geminiService.generateProblemsFromFile(
      file.path,
      file.mimetype,
      subject || problemSet.title,
      parseInt(count)
    )

    // Save problems to database
    const createdProblems = await Promise.all(
      generatedProblems.map(problem =>
        prisma.problem.create({
          data: {
            problemSetId,
            question: problem.question,
            answer: problem.answer,
            difficulty: problem.difficulty
          }
        })
      )
    )

    // Clean up uploaded file
    await fs.unlink(file.path)

    res.status(201).json({
      message: `Successfully generated ${createdProblems.length} problems`,
      problems: createdProblems
    })
  } catch (error) {
    console.error('Generate problems error:', error)
    // Clean up file on error
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {})
    }
    res.status(500).json({ message: 'Failed to generate problems. Make sure you have set up your Gemini API key.' })
  }
}
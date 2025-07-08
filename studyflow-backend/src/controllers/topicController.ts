import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface AuthRequest extends Request {
  userId?: string
}

export const createTopic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const topic = await prisma.topic.create({
      data: {
        name,
        description,
        userId
      }
    })

    res.status(201).json(topic)
  } catch (error) {
    console.error('Create topic error:', error)
    res.status(500).json({ message: 'Failed to create topic' })
  }
}

export const getUserTopics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const topics = await prisma.topic.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { studySessions: true }
        }
      }
    })

    res.json(topics)
  } catch (error) {
    console.error('Get topics error:', error)
    res.status(500).json({ message: 'Failed to fetch topics' })
  }
}

export const updateTopic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, description } = req.body
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    // Verify ownership
    const topic = await prisma.topic.findFirst({
      where: { id, userId }
    })

    if (!topic) {
      res.status(404).json({ message: 'Topic not found' })
      return
    }

    const updatedTopic = await prisma.topic.update({
      where: { id },
      data: { name, description }
    })

    res.json(updatedTopic)
  } catch (error) {
    console.error('Update topic error:', error)
    res.status(500).json({ message: 'Failed to update topic' })
  }
}

export const deleteTopic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    // Verify ownership
    const topic = await prisma.topic.findFirst({
      where: { id, userId }
    })

    if (!topic) {
      res.status(404).json({ message: 'Topic not found' })
      return
    }

    await prisma.topic.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete topic error:', error)
    res.status(500).json({ message: 'Failed to delete topic' })
  }
}
/**
 * User Registration API
 * 
 * Creates a new user with email/password credentials.
 */

import { type NextApiRequest, type NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Validate input
    const { name, email, password } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        // Create default subscription
        subscription: {
          create: {
            plan: 'FREE',
            status: 'ACTIVE',
          },
        },
      },
    });

    // Create default notification preferences
    const notificationTypes = ['MATCH_START', 'TOSS_RESULT', 'MATCH_RESULT'] as const;
    const channels = ['IN_APP', 'EMAIL'] as const;
    
    const prefs = notificationTypes.flatMap((type) =>
      channels.map((channel) => ({
        userId: user.id,
        type,
        channel,
        enabled: channel === 'IN_APP', // Only in-app enabled by default
      }))
    );
    
    await prisma.notificationPreference.createMany({
      data: prefs,
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: error.errors,
      });
    }

    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'stocksense-dev-secret';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ─── Schemas ──────────────────────────────────────────────────────────────────
const signupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  loginId:  z.string().min(3, 'Login ID must be at least 3 characters').max(50)
              .regex(/^[a-z0-9_.-]+$/, 'Login ID may only contain lowercase letters, numbers, dots, underscores and hyphens'),
  email:    z.string().email('Must be a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  loginId:  z.string().min(1),
  password: z.string().min(1),
});

// ─── POST /api/auth/signup ─────────────────────────────────────────────────────
authRouter.post('/signup', async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);

    const existingEmail   = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) {
      res.status(409).json({ error: { code: 'CONFLICT', message: 'Email already registered' } });
      return;
    }

    const existingLogin = await prisma.user.findUnique({ where: { loginId: data.loginId } });
    if (existingLogin) {
      res.status(409).json({ error: { code: 'CONFLICT', message: 'Login ID already taken' } });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        fullName:     data.fullName,
        loginId:      data.loginId,
        email:        data.email,
        passwordHash,
      },
      select: { id: true, email: true, fullName: true, loginId: true, role: true },
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, COOKIE_OPTS);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
authRouter.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { loginId: data.loginId } });
    if (!user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid Login Id or Password' } });
      return;
    }

    const match = await bcrypt.compare(data.password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid Login Id or Password' } });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, COOKIE_OPTS);
    res.json({
      user: {
        id:       user.id,
        email:    user.email,
        fullName: user.fullName,
        loginId:  user.loginId,
        role:     user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/logout ─────────────────────────────────────────────────────
authRouter.post('/logout', (_req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  res.json({ message: 'Logged out' });
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────────
authRouter.get('/me', async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, fullName: true, loginId: true, role: true, createdAt: true },
    });

    if (!user) {
      res.clearCookie('token');
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Email is required' } });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak whether email exists
      res.json({ message: 'If the email exists, an OTP was sent' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.passwordResetOtp.create({
      data: {
        userId: user.id,
        otpHash,
        expiresAt,
      }
    });

    // In a real app, send email here. For now, we will log it.
    console.log(`[DEV] OTP for ${email} is ${otp}`);

    res.json({ message: 'If the email exists, an OTP was sent' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid input' } });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid OTP or email' } });
      return;
    }

    // Find latest active OTP
    const otps = await prisma.passwordResetOtp.findMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { expiresAt: 'desc' },
      take: 1
    });

    if (otps.length === 0) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid or expired OTP' } });
      return;
    }

    const activeOtp = otps[0];
    const match = await bcrypt.compare(otp, activeOtp.otpHash);
    if (!match) {
      await prisma.passwordResetOtp.update({
        where: { id: activeOtp.id },
        data: { attempts: activeOtp.attempts + 1 }
      });
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid OTP' } });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      }),
      prisma.passwordResetOtp.update({
        where: { id: activeOtp.id },
        data: { used: true }
      })
    ]);

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
});

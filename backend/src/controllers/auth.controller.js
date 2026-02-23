import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

import prisma from '../services/prisma.service.js';

const googleClient = new OAuth2Client();

function signToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const error = new Error('Email already in use');
      error.status = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword }
    });

    const token = signToken(user);

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const error = new Error('Invalid email or password');
      error.status = 401;
      throw error;
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      const error = new Error('Invalid email or password');
      error.status = 401;
      throw error;
    }

    const token = signToken(user);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function googleAuth(req, res, next) {
  try {
    const { credential } = req.body;

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      const error = new Error('Google auth is not configured');
      error.status = 500;
      throw error;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId
    });

    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase();
    if (!email) {
      const error = new Error('Unable to read Google profile email');
      error.status = 401;
      throw error;
    }

    if (payload?.email_verified === false) {
      const error = new Error('Google email is not verified');
      error.status = 401;
      throw error;
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const name = payload?.name || 'Google User';
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword
        }
      });
    }

    const token = signToken(user);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    next(error);
  }
}

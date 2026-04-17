'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { signIn } from '@/lib/auth';
import { getUserId } from '@/lib/session';
import type { ActionResult } from '@/types/action-result';

export async function register(data: {
  name: string;
  email: string;
  password: string;
}): Promise<ActionResult> {
  try {
    const { name, email, password } = data;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.create({
      data: { name, email, password: hashedPassword },
    });

    await signIn('credentials', { email, password, redirectTo: '/' });
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to create account' };
  }
}

export async function updateProfile(data: {
  name: string;
}): Promise<ActionResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    await db.user.update({
      where: { id: userId },
      data: { name: data.name.trim() },
    });

    revalidatePath('/settings');
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update profile' };
  }
}

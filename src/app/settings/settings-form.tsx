'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';
import { updateProfile } from '../_actions/auth-actions';

interface SettingsFormProps {
  user: {
    name: string;
    email: string;
    image: string;
  };
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [name, setName] = useState(user.name);
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    startTransition(async () => {
      const result = await updateProfile({ name: name.trim() });

      if (result.success) {
        toast.success('Profile updated');
      } else {
        toast.error(result.error ?? 'Something went wrong');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name}
            width={64}
            height={64}
            className="rounded-full"
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <User className="size-8 text-muted-foreground" />
          </div>
        )}
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Display name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-border bg-card py-3 px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
        />
        <button
          type="submit"
          disabled={isPending || name.trim() === user.name}
          className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <div className="space-y-3">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full rounded-xl border border-destructive/30 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          Sign Out
        </button>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account
          </p>
        </div>

        <SettingsForm
          user={{
            name: session.user.name ?? '',
            email: session.user.email ?? '',
            image: session.user.image ?? '',
          }}
        />
      </div>
    </div>
  );
}

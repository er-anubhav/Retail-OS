import { FormEvent, useState } from 'react';
import { LockKeyhole, LogIn, Store } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { BrutalButton } from '@/components/brutal';
import { useAuth } from '@/lib/auth';

export default function SignIn() {
  const { user, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('manager@retail.ai');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/'} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10 font-mono selection:bg-coral selection:text-cream">
      <section className="w-full max-w-[460px] rounded-3xl border-3 border-ink bg-white hard-shadow overflow-hidden">
        {/* Header */}
        <div className="border-b-3 border-ink bg-lime px-6 py-6">
          <div className="flex items-center gap-3.5">
            <span className="grid size-12 place-items-center rounded-full border-2 border-ink bg-coral text-cream hard-shadow-xs shrink-0">
              <Store className="size-6 stroke-[2.5]" />
            </span>
            <div>
              <h1 className="font-serif text-3xl font-bold uppercase tracking-tight text-ink">
                RETAIL//AI
              </h1>
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink/75 mt-0.5">
                Edge Store Intelligence Login
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 sm:p-7">
          <label className="block">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink/75">
              Email Address
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="mt-1.5 w-full rounded-xl border-2 border-ink bg-cream px-4 py-2.5 text-sm font-bold text-ink outline-none hard-shadow-xs focus:border-sky transition-colors"
              required
            />
          </label>

          <label className="block">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink/75">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-xl border-2 border-ink bg-cream px-4 py-2.5 text-sm font-bold text-ink outline-none hard-shadow-xs focus:border-sky transition-colors"
              required
            />
          </label>

          {error && (
            <div className="rounded-xl border-2 border-ink bg-coral/90 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-cream hard-shadow-xs">
              {error}
            </div>
          )}

          <div className="pt-2">
            <BrutalButton
              type="submit"
              variant="primary"
              size="lg"
              full
              disabled={submitting}
              icon={submitting ? <LockKeyhole className="size-4 stroke-[3]" /> : <LogIn className="size-4 stroke-[3]" />}
            >
              {submitting ? 'SIGNING IN...' : 'SIGN IN TO DASHBOARD'}
            </BrutalButton>
          </div>

          <p className="text-center font-mono text-xs uppercase tracking-wider text-ink/60 pt-2">
            Demo: manager@retail.ai / password123
          </p>
        </form>
      </section>
    </main>
  );
}

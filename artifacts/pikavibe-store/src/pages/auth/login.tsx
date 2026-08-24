import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { adminLogin } from '@/lib/api';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await adminLogin(email, password);
      localStorage.setItem('pikavibe-admin-token', result.token);
      setLocation('/admin');
    } catch {
      setError('Invalid admin credentials. Check your email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-16"><div className="w-full max-w-md"><div className="mb-7 text-center"><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-primary">PikaVibe operations</p><h1 className="font-display text-5xl tracking-[-.05em] text-foreground">Admin sign in</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">This area is reserved for store administrators. Customers can place orders without creating an account.</p></div><div className="rounded-[2rem] border border-border bg-card p-6 shadow-soft sm:p-9"><form onSubmit={handleSubmit} className="space-y-5"><label className="grid gap-2 text-xs font-bold uppercase tracking-wider">Email address<div className="relative"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-border bg-background py-3.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="admin@example.com" /></div></label><label className="grid gap-2 text-xs font-bold uppercase tracking-wider">Password<div className="relative"><Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-border bg-background py-3.5 pl-11 pr-12 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••" /><button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>{error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}<button type="submit" disabled={submitting} className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">{submitting ? 'Signing in…' : 'Sign in to admin'}</button></form><Link href="/" className="mt-6 flex items-center justify-center gap-2 border-t border-border pt-6 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to store</Link></div></div></div>;
}

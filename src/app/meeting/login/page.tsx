'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';

export default function BookingLogin() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, type: 'booking' }),
            });

            if (res.ok) {
                router.push('/');
                router.refresh(); // Force refresh to run middleware again
            } else {
                const data = await res.json();
                setError(data.error || 'Incorrect password');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200/50 dark:border-zinc-800/50 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-full flex items-center justify-center mb-6">
                    <Logo />
                </div>

                <h1 className="font-pixel text-xl tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                    Private Booking
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mb-8 font-mono">
                    Please enter the guest password to schedule a meeting.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password..."
                            required
                            className="font-mono w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 font-medium text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="font-pixel text-[10px] uppercase w-full flex items-center justify-center py-4 px-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Access Calendar'}
                    </button>
                </form>
            </div>
        </div>
    );
}

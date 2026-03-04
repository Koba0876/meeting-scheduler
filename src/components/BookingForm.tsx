'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Loader2, Calendar, Clock, ArrowLeft } from 'lucide-react';

interface BookingFormProps {
    selectedSlot: string;
    onBack: () => void;
    onSuccess: (meetLink: string, eventLink: string) => void;
    clientTimezone: string;
}

export default function BookingForm({ selectedSlot, onBack, onSuccess, clientTimezone }: BookingFormProps) {
    const [meetingTitle, setMeetingTitle] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [extraGuests, setExtraGuests] = useState<{ name: string, email: string }[]>([]);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const slotDate = new Date(selectedSlot);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    meetingTitle,
                    name,
                    email,
                    extraGuests,
                    startTime: selectedSlot,
                    notes,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to book meeting');
            }

            onSuccess(data.meetLink, data.eventLink);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
            <button
                onClick={onBack}
                className="flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </button>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/10 dark:to-blue-500/10 rounded-2xl p-5 mb-8 border border-indigo-100/50 dark:border-indigo-500/20">
                <h3 className="font-pixel text-[10px] text-indigo-900 dark:text-indigo-300 mb-3 uppercase tracking-wider">Meeting Details</h3>
                <div className="flex flex-col gap-2.5 text-[15px] font-medium text-indigo-800/90 dark:text-indigo-200">
                    <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-3 opacity-70" />
                        {formatInTimeZone(slotDate, clientTimezone || 'UTC', 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-3 opacity-70" />
                        {formatInTimeZone(slotDate, clientTimezone || 'UTC', 'h:mm a')} - {formatInTimeZone(new Date(slotDate.getTime() + 30 * 60000), clientTimezone || 'UTC', 'h:mm a')}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Meeting Title / Name
                    </label>
                    <input
                        id="title"
                        type="text"
                        required
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-400 shadow-sm"
                        placeholder="e.g. Project Kickoff"
                    />
                </div>

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Your Full Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-400 shadow-sm"
                        placeholder="John Doe"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-400 shadow-sm"
                        placeholder="john@example.com"
                    />
                </div>

                <div className="pt-2">
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Additional Guests (Optional)
                        </label>
                        <button
                            type="button"
                            onClick={() => setExtraGuests([...extraGuests, { name: '', email: '' }])}
                            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center"
                        >
                            <span className="mr-1 text-lg leading-none">+</span> Add guest
                        </button>
                    </div>

                    {extraGuests.length > 0 && (
                        <div className="space-y-3 mt-3">
                            {extraGuests.map((guest, index) => (
                                <div key={index} className="flex gap-3 relative group">
                                    <input
                                        type="text"
                                        required
                                        value={guest.name}
                                        onChange={(e) => {
                                            const newGuests = [...extraGuests];
                                            newGuests[index].name = e.target.value;
                                            setExtraGuests(newGuests);
                                        }}
                                        className="flex-1 px-3 py-2 text-sm rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-400"
                                        placeholder="Full Name"
                                    />
                                    <input
                                        type="email"
                                        required
                                        value={guest.email}
                                        onChange={(e) => {
                                            const newGuests = [...extraGuests];
                                            newGuests[index].email = e.target.value;
                                            setExtraGuests(newGuests);
                                        }}
                                        className="flex-1 px-3 py-2 text-sm rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-400"
                                        placeholder="Email Address"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newGuests = [...extraGuests];
                                            newGuests.splice(index, 1);
                                            setExtraGuests(newGuests);
                                        }}
                                        className="absolute -right-8 top-1.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-opacity p-1"
                                        title="Remove guest"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Additional Notes (Optional)
                    </label>
                    <textarea
                        id="notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-400 resize-none shadow-sm"
                        placeholder="Please share anything that will help prepare for our meeting."
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-500/20 flex items-start">
                        <span className="mr-2">⚠️</span> {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="font-pixel text-[10px] uppercase w-full py-4 px-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-indigo-500/30"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Confirming...
                        </>
                    ) : (
                        'Confirm Booking'
                    )}
                </button>
            </form>
        </div>
    );
}

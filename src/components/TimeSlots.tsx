'use client';

import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Loader2 } from 'lucide-react';

interface TimeSlotsProps {
    date: Date;
    slots: string[];
    isLoading: boolean;
    selectedSlot: string | null;
    onSelectSlot: (slot: string) => void;
    clientTimezone: string;
}

export default function TimeSlots({
    date,
    slots,
    isLoading,
    selectedSlot,
    onSelectSlot,
    clientTimezone
}: TimeSlotsProps) {

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 w-full">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                <p className="text-zinc-500 font-medium">Checking availability...</p>
            </div>
        );
    }

    if (slots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 w-full text-center px-4">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">🗓️</span>
                </div>
                <p className="text-zinc-800 dark:text-zinc-200 font-medium mb-1">No slots available</p>
                <p className="text-zinc-500 text-sm">Please select a different date for your meeting.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h3 className="font-pixel text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                        {format(date, 'EEEE')}
                    </h3>
                    <p className="text-zinc-500 text-sm">{format(date, 'MMM d, yyyy')}</p>
                </div>
            </div>

            <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3 pb-2">
                    {[...slots].sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).map((slot) => {
                        const isSelected = selectedSlot === slot;
                        const timeString = formatInTimeZone(new Date(slot), clientTimezone || 'UTC', 'h:mm a');

                        return (
                            <button
                                key={slot}
                                onClick={() => onSelectSlot(slot)}
                                className={`
                  font-pixel text-[10px] py-4 px-4 rounded-xl transition-all duration-200 border
                  ${isSelected
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/30 ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 scale-[1.02]'
                                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                                    }
                `}
                            >
                                {timeString}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

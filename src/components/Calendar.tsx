'use client';

import { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    isBefore,
    startOfDay
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
    selectedDate: Date | null;
    onSelectDate: (date: Date) => void;
}

export default function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(startOfMonth(new Date()));

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
        days.push(day);
        day = addDays(day, 1);
    }

    const today = startOfDay(new Date());

    return (
        <div className="w-full max-w-md mx-auto bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-none border border-zinc-200/50 dark:border-zinc-800/50 p-6 transition-all">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-pixel text-sm text-zinc-800 dark:text-zinc-100 uppercase tracking-tight">
                    {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={prevMonth}
                        disabled={isBefore(endOfMonth(subMonths(currentDate, 1)), startOfMonth(today))}
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-zinc-600 dark:text-zinc-400"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2 text-center font-pixel text-[8px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((dayName) => (
                    <div key={dayName} className="py-2">{dayName}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((d, i) => {
                    const isSelected = selectedDate ? isSameDay(d, selectedDate) : false;
                    const isPast = isBefore(d, today);
                    const isCurrentMonth = isSameMonth(d, currentDate);

                    return (
                        <button
                            key={i}
                            onClick={() => !isPast && isCurrentMonth && onSelectDate(d)}
                            disabled={isPast || !isCurrentMonth}
                            className={`
                aspect-square flex items-center justify-center rounded-full text-sm transition-all relative
                ${!isCurrentMonth ? 'text-zinc-300 dark:text-zinc-700 cursor-default hidden sm:flex' : ''}
                ${isCurrentMonth && isPast ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed' : ''}
                ${isCurrentMonth && !isPast && !isSelected ? 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white cursor-pointer active:scale-95' : ''}
                ${isSelected ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-500/30 scale-105' : ''}
              `}
                        >
                            {isCurrentMonth || !isCurrentMonth ? format(d, 'd') : ''}
                            {isSameDay(d, today) && !isSelected && (
                                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-500"></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

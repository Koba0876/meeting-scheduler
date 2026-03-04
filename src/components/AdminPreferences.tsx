'use client';

import { useState, useEffect } from 'react';
import { AvailabilityPreferences, TimeBlock } from '@/lib/preferences';
import { Loader2, Save } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminPreferences() {
    const [prefs, setPrefs] = useState<AvailabilityPreferences | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetch('/api/preferences')
            .then(res => res.json())
            .then(data => {
                setPrefs(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setMessage({ text: 'Failed to load preferences', type: 'error' });
                setIsLoading(false);
            });
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage({ text: '', type: '' });

        try {
            const res = await fetch('/api/preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(prefs),
            });

            if (res.ok) {
                setMessage({ text: 'Preferences saved successfully!', type: 'success' });
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            setMessage({ text: 'Error saving preferences', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };



    const updateDayWorking = (dayIndex: number, isWorking: boolean) => {
        if (!prefs) return;
        setPrefs({
            ...prefs,
            schedule: {
                ...prefs.schedule,
                [dayIndex]: {
                    // @ts-expect-error - index
                    ...prefs.schedule[dayIndex],
                    isWorking
                }
            }
        });
    };

    const updateBlock = (dayIndex: number, blockIndex: number, field: 'start' | 'end', value: string) => {
        if (!prefs) return;
        // @ts-expect-error - index
        const currentBlocks = [...prefs.schedule[dayIndex].timeBlocks];
        currentBlocks[blockIndex] = { ...currentBlocks[blockIndex], [field]: value };

        setPrefs({
            ...prefs,
            schedule: {
                ...prefs.schedule,
                [dayIndex]: {
                    // @ts-expect-error - index
                    ...prefs.schedule[dayIndex],
                    timeBlocks: currentBlocks
                }
            }
        });
    };

    const addBlock = (dayIndex: number) => {
        if (!prefs) return;
        // @ts-expect-error - index
        const currentBlocks = [...prefs.schedule[dayIndex].timeBlocks];
        currentBlocks.push({ start: '09:00', end: '17:00' });

        setPrefs({
            ...prefs,
            schedule: {
                ...prefs.schedule,
                [dayIndex]: {
                    // @ts-expect-error - index
                    ...prefs.schedule[dayIndex],
                    timeBlocks: currentBlocks
                }
            }
        });
    };

    const removeBlock = (dayIndex: number, blockIndex: number) => {
        if (!prefs) return;
        // @ts-expect-error - index
        const currentBlocks = [...prefs.schedule[dayIndex].timeBlocks];
        currentBlocks.splice(blockIndex, 1);

        setPrefs({
            ...prefs,
            schedule: {
                ...prefs.schedule,
                [dayIndex]: {
                    // @ts-expect-error - index
                    ...prefs.schedule[dayIndex],
                    timeBlocks: currentBlocks
                }
            }
        });
    };

    const applyToAllDays = (sourceDayIndex: number) => {
        if (!prefs) return;

        // @ts-expect-error - index
        const sourceSchedule = prefs.schedule[sourceDayIndex];
        const newSchedule = { ...prefs.schedule };

        for (let i = 0; i < 7; i++) {
            if (i !== sourceDayIndex) {
                // @ts-expect-error - index
                newSchedule[i] = {
                    // @ts-expect-error - index
                    ...newSchedule[i],
                    isWorking: sourceSchedule.isWorking,
                    // deep copy
                    timeBlocks: sourceSchedule.timeBlocks.map((block: TimeBlock) => ({ ...block }))
                };
            }
        }

        setPrefs({
            ...prefs,
            schedule: newSchedule
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!prefs) return null;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="font-pixel text-xl sm:text-2xl tracking-tight text-zinc-900 dark:text-zinc-50">
                            Availability Settings
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                            Configure your weekly working hours.
                        </p>
                    </div>

                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Timezone
                        </label>
                        <select
                            value={prefs.timezone}
                            onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
                            className="w-full max-w-sm px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {/* Fallback to Intl resolved tz for current dropdown options */}
                            <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                                {Intl.DateTimeFormat().resolvedOptions().timeZone} (Local)
                            </option>
                            <option value="America/Los_Angeles">Pacific Time (PT)</option>
                            <option value="America/Denver">Mountain Time (MT)</option>
                            <option value="America/Chicago">Central Time (CT)</option>
                            <option value="America/New_York">Eastern Time (ET)</option>
                            <option value="Europe/London">London (GMT/BST)</option>
                            <option value="Europe/Paris">Central European Time (CET)</option>
                            <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                        </select>
                        <p className="text-xs text-zinc-500 mt-2">
                            Note: This simple dropdown has limited options. For full support, stick to your local timezone or manually type a valid IANA string.
                        </p>
                    </div>

                    <div className="p-6">
                        <h3 className="font-pixel text-[12px] uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-6">Weekly Hours</h3>

                        <div className="space-y-4">
                            {DAYS.map((dayName, index) => {
                                // @ts-expect-error - index
                                const daySchedule = prefs.schedule[index];

                                return (
                                    <div key={dayName} className="flex flex-col sm:flex-row sm:items-start py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                                        <div className="w-40 flex items-center mb-3 sm:mb-0 sm:mt-2">
                                            <input
                                                type="checkbox"
                                                checked={daySchedule.isWorking}
                                                onChange={(e) => updateDayWorking(index, e.target.checked)}
                                                className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
                                            />
                                            <span className="ml-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                                {dayName}
                                            </span>
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            {daySchedule.isWorking ? (
                                                <>
                                                    {daySchedule.timeBlocks && daySchedule.timeBlocks.map((block: TimeBlock, bIndex: number) => (
                                                        <div key={bIndex} className="flex items-center gap-2 sm:gap-3">
                                                            <input
                                                                type="time"
                                                                value={block.start}
                                                                onChange={(e) => updateBlock(index, bIndex, 'start', e.target.value)}
                                                                className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                                                            />
                                                            <span className="text-zinc-500 text-sm">to</span>
                                                            <input
                                                                type="time"
                                                                value={block.end}
                                                                onChange={(e) => updateBlock(index, bIndex, 'end', e.target.value)}
                                                                className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                                                            />
                                                            {daySchedule.timeBlocks.length > 1 && (
                                                                <button
                                                                    onClick={() => removeBlock(index, bIndex)}
                                                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                                                                    title="Remove block"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <button
                                                            onClick={() => addBlock(index)}
                                                            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center"
                                                        >
                                                            <span className="mr-1 text-lg leading-none">+</span> Add block
                                                        </button>
                                                        <button
                                                            onClick={() => applyToAllDays(index)}
                                                            className="text-xs font-medium text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center"
                                                            title="Copy these hours to all other days"
                                                        >
                                                            Apply to all days
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="sm:mt-2">
                                                    <span className="text-sm text-zinc-400 dark:text-zinc-500 italic">Unavailable</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                        {message.text ? (
                            <span className={`text-sm font-medium ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                                {message.text}
                            </span>
                        ) : (
                            <span />
                        )}

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="font-pixel text-[10px] uppercase flex items-center px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 shadow-sm"
                        >
                            {isSaving ? (
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5 mr-2" />
                            )}
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

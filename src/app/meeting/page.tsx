'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import Calendar from '@/components/Calendar';
import TimeSlots from '@/components/TimeSlots';
import BookingForm from '@/components/BookingForm';
import { CheckCircle, Clock } from 'lucide-react';
import Logo from '@/components/Logo';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<'select' | 'form' | 'success'>('select');

  const [clientTimezone, setClientTimezone] = useState<string>('');
  const [availableTimezones, setAvailableTimezones] = useState<string[]>([]);

  useEffect(() => {
    setClientTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    try {
      setAvailableTimezones(Intl.supportedValuesOf('timeZone'));
    } catch (e) {
      setAvailableTimezones([
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
        'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney'
      ]);
    }
  }, []);

  const [meetLink, setMeetLink] = useState('');
  const [eventLink, setEventLink] = useState('');

  const fetchAvailability = useCallback(async (date: Date) => {
    setIsLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedSlot(null);
    setBookingStep('select');

    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const response = await fetch(`/api/availability?date=${dateString}`);
      const data = await response.json();

      if (response.ok) {
        setAvailableSlots(data.availableSlots || []);
      } else {
        console.error('Error fetching availability:', data.error);
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate, fetchAvailability]);

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSelectSlot = (slot: string) => {
    setSelectedSlot(slot);
    setBookingStep('form');
  };

  const handleBackToSlots = () => {
    setBookingStep('select');
    setSelectedSlot(null);
  };

  const handleBookingSuccess = (meet: string, event: string) => {
    setMeetLink(meet);
    setEventLink(event);
    setBookingStep('success');
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full relative z-10">
        <div className="text-center mb-10 mt-6">
          <div className="w-full flex justify-center mb-6">
            <Logo />
          </div>
          <h1 className="font-pixel text-xl sm:text-2xl tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
            Schedule a Meeting
          </h1>
          <p className="font-mono text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
            Set up your meeting with Bait Society. Choose a time that works for you. We will automatically generate a Google Meet link and send you an invitation.
          </p>

          {clientTimezone && (
            <div className="mt-8 flex items-center justify-center gap-3 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 max-w-xs mx-auto">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Timezone:</span>
              <select
                value={clientTimezone}
                onChange={(e) => setClientTimezone(e.target.value)}
                className="flex-1 bg-zinc-800 dark:bg-zinc-800 text-zinc-100 px-2 py-1 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {availableTimezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')} {tz === Intl.DateTimeFormat().resolvedOptions().timeZone ? '(Local)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {bookingStep === 'success' ? (
          <div className="max-w-md mx-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-zinc-200/50 dark:border-zinc-800/50 p-8 text-center animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Booking Confirmed!</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8">
              Your meeting has been scheduled and invitations have been sent to your email.
            </p>

            <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-4 mb-8 text-left border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center text-zinc-700 dark:text-zinc-300 mb-3">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">
                  {selectedSlot && clientTimezone && formatInTimeZone(new Date(selectedSlot), clientTimezone, 'EEEE, MMMM d, yyyy \x40 h:mm a')}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {meetLink && (
                <a
                  href={meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-pixel text-[10px] uppercase w-full py-4 px-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors inline-block text-center"
                >
                  Join Google Meet
                </a>
              )}
              {eventLink && (
                <a
                  href={eventLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-pixel text-[10px] uppercase w-full py-4 px-4 rounded-xl bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors inline-block text-center"
                >
                  View in Google Calendar
                </a>
              )}
              <button
                onClick={() => {
                  setBookingStep('select');
                  setSelectedSlot(null);
                  setSelectedDate(null);
                }}
                className="mt-2 text-xs font-pixel uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Schedule another meeting
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="w-full lg:w-1/2">
              <Calendar
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
            </div>

            <div className="w-full lg:w-1/2 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-none border border-zinc-200/50 dark:border-zinc-800/50 p-6 sm:p-8 min-h-[450px]">
              {!selectedDate ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 text-indigo-500">
                    <Clock className="w-8 h-8 opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">Select a Date</h3>
                  <p className="text-zinc-500 text-sm">Please select a date on the calendar to see available time slots.</p>
                </div>
              ) : bookingStep === 'select' ? (
                <TimeSlots
                  date={selectedDate}
                  slots={availableSlots}
                  isLoading={isLoadingSlots}
                  selectedSlot={selectedSlot}
                  onSelectSlot={handleSelectSlot}
                  clientTimezone={clientTimezone}
                />
              ) : (
                <BookingForm
                  selectedSlot={selectedSlot!}
                  onBack={handleBackToSlots}
                  onSuccess={handleBookingSuccess}
                  clientTimezone={clientTimezone}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

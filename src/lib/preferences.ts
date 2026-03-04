import fs from 'fs';
import path from 'path';

export interface TimeBlock {
    start: string; // "HH:mm" format (24h)
    end: string;   // "HH:mm" format (24h)
}

export interface DaySchedule {
    isWorking: boolean;
    timeBlocks: TimeBlock[];
}

export interface AvailabilityPreferences {
    timezone: string;
    schedule: {
        0: DaySchedule; // Sunday
        1: DaySchedule; // Monday
        2: DaySchedule; // Tuesday
        3: DaySchedule; // Wednesday
        4: DaySchedule; // Thursday
        5: DaySchedule; // Friday
        6: DaySchedule; // Saturday
    };
}

const DEFAULT_PREFERENCES: AvailabilityPreferences = {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    schedule: {
        0: { isWorking: true, timeBlocks: [{ start: '00:00', end: '01:00' }, { start: '08:00', end: '23:59' }] }, // Sunday
        1: { isWorking: true, timeBlocks: [{ start: '00:00', end: '01:00' }, { start: '08:00', end: '23:59' }] }, // Monday
        2: { isWorking: true, timeBlocks: [{ start: '00:00', end: '01:00' }, { start: '08:00', end: '23:59' }] }, // Tuesday
        3: { isWorking: true, timeBlocks: [{ start: '00:00', end: '01:00' }, { start: '08:00', end: '23:59' }] }, // Wednesday
        4: { isWorking: true, timeBlocks: [{ start: '00:00', end: '01:00' }, { start: '08:00', end: '23:59' }] }, // Thursday
        5: { isWorking: true, timeBlocks: [{ start: '00:00', end: '01:00' }, { start: '08:00', end: '23:59' }] }, // Friday
        6: { isWorking: true, timeBlocks: [{ start: '00:00', end: '01:00' }, { start: '08:00', end: '23:59' }] }, // Saturday
    }
};

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'preferences.json');

export async function getPreferences(): Promise<AvailabilityPreferences> {
    try {
        if (!fs.existsSync(DATA_FILE_PATH)) {
            return DEFAULT_PREFERENCES;
        }

        const fileContent = await fs.promises.readFile(DATA_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);

        // Migrate old format to new format if necessary
        for (let i = 0; i < 7; i++) {
            if (parsed.schedule && parsed.schedule[i]) {
                if (parsed.schedule[i].start !== undefined && !parsed.schedule[i].timeBlocks) {
                    parsed.schedule[i].timeBlocks = [
                        { start: parsed.schedule[i].start, end: parsed.schedule[i].end }
                    ];
                    delete parsed.schedule[i].start;
                    delete parsed.schedule[i].end;
                } else if (!parsed.schedule[i].timeBlocks) {
                    parsed.schedule[i].timeBlocks = [{ start: '09:00', end: '17:00' }];
                }
            }
        }

        return parsed as AvailabilityPreferences;
    } catch (error) {
        console.error('Error reading preferences:', error);
        return DEFAULT_PREFERENCES;
    }
}

export async function savePreferences(preferences: AvailabilityPreferences): Promise<void> {
    try {
        const dir = path.dirname(DATA_FILE_PATH);
        if (!fs.existsSync(dir)) {
            await fs.promises.mkdir(dir, { recursive: true });
        }

        await fs.promises.writeFile(DATA_FILE_PATH, JSON.stringify(preferences, null, 2));
    } catch (error) {
        console.error('Error saving preferences:', error);
        throw new Error('Failed to save preferences');
    }
}

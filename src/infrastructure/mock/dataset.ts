import sampleFile from '../../../sample-data.json';
import { SCHEDULE_DATE, SCHEDULE_TIME_ZONE } from '../../domain/constants.ts';
import type { Service, Slot } from '../../domain/types.ts';
import { parseClock } from '../../domain/time.ts';

interface SampleFile {
  readonly date: string;
  readonly timeZone: string;
  readonly services: readonly {
    readonly id: string;
    readonly title: string;
    readonly durationMinutes: number;
  }[];
  readonly slots: readonly {
    readonly id: string;
    readonly serviceId: string;
    readonly doctorId: string;
    readonly clinicId: string;
    readonly start: string;
    readonly end: string;
    readonly remainingCapacity: number;
  }[];
}

const parsed = parseSample(sampleFile as SampleFile);

export function loadSampleDataset(): { services: Service[]; slots: Slot[] } {
  return {
    services: parsed.services.map((service) => ({ ...service })),
    slots: parsed.slots.map((slot) => ({ ...slot })),
  };
}

function parseSample(file: SampleFile): { services: Service[]; slots: Slot[] } {
  if (file.date !== SCHEDULE_DATE || file.timeZone !== SCHEDULE_TIME_ZONE) {
    throw new Error('Sample data date or time zone does not match the scheduling day.');
  }

  return {
    services: file.services.map((service) => ({ ...service })),
    slots: file.slots.map((slot) => {
      const startMinutes = parseClock(slot.start);
      const endMinutes = parseClock(slot.end);
      if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) {
        throw new Error(`Invalid sample slot: ${slot.id}`);
      }

      return {
        id: slot.id,
        serviceId: slot.serviceId,
        doctorId: slot.doctorId,
        clinicId: slot.clinicId,
        startMinutes,
        endMinutes,
        remainingCapacity: slot.remainingCapacity,
      };
    }),
  };
}

import { describe, expect, it } from 'vitest';
import { SCHEDULE_DATE } from '../../domain/constants.ts';
import { createInMemorySchedulingApi } from './in-memory-api.ts';

const instant = async () => {};

describe('in-memory scheduling api', () => {
  it('returns an independent slot snapshot', async () => {
    const api = createInMemorySchedulingApi({ sleep: instant });
    const first = await api.getSlots(SCHEDULE_DATE);
    const c1 = first.slots.find((slot) => slot.id === 'c1');
    if (!c1) throw new Error('c1 is missing');
    (c1 as { remainingCapacity: number }).remainingCapacity = 0;

    const second = await api.getSlots(SCHEDULE_DATE);
    expect(second.slots.find((slot) => slot.id === 'c1')?.remainingCapacity).toBe(1);
    expect(first.slots.find((slot) => slot.id === 'c1')?.remainingCapacity).toBe(0);
  });

  it('uses 1500ms then 200ms for the first two out-of-order reads', async () => {
    const delays: number[] = [];
    const api = createInMemorySchedulingApi({
      sleep: async (ms) => {
        delays.push(ms);
      },
    });
    api.setMode('out-of-order');

    await api.getSlots(SCHEDULE_DATE);
    await api.getSlots(SCHEDULE_DATE);
    await api.getSlots(SCHEDULE_DATE);

    expect(delays).toEqual([1500, 200, 300]);
  });

  it('fails the next slot read once in transient mode, then succeeds', async () => {
    const api = createInMemorySchedulingApi({ sleep: instant });
    api.setMode('transient-error');

    await expect(api.getSlots(SCHEDULE_DATE)).rejects.toMatchObject({ code: 'TRANSIENT' });
    await expect(api.getSlots(SCHEDULE_DATE)).resolves.toMatchObject({ date: SCHEDULE_DATE });

    api.setMode('transient-error');
    await expect(api.getSlots(SCHEDULE_DATE)).rejects.toMatchObject({ code: 'TRANSIENT' });
  });

  it('confirms a booking and decrements every selected slot', async () => {
    const api = createInMemorySchedulingApi({ sleep: instant });
    const receipt = await api.book({ slotIds: ['a2', 'b1', 'c1'] });

    expect(receipt).toEqual({
      bookingId: 'bk-1',
      slotIds: ['a2', 'b1', 'c1'],
      status: 'confirmed',
    });

    const after = await api.getSlots(SCHEDULE_DATE);
    expect(capacity(after.slots, 'a2')).toBe(0);
    expect(capacity(after.slots, 'b1')).toBe(0);
    expect(capacity(after.slots, 'c1')).toBe(0);
    expect(capacity(after.slots, 'a1')).toBe(1);
  });

  it('does not decrement any slot when one of them is unavailable', async () => {
    const api = createInMemorySchedulingApi({ sleep: instant });
    await api.book({ slotIds: ['b1'] });

    await expect(api.book({ slotIds: ['a2', 'b1', 'c1'] })).rejects.toMatchObject({
      code: 'SLOT_UNAVAILABLE',
      conflictingSlotIds: ['b1'],
    });

    const after = await api.getSlots(SCHEDULE_DATE);
    expect(capacity(after.slots, 'a2')).toBe(1);
    expect(capacity(after.slots, 'c1')).toBe(1);
    expect(capacity(after.slots, 'b1')).toBe(0);
  });

  it('zeros c1 on a conflict booking and leaves a2 and b1 unchanged', async () => {
    const api = createInMemorySchedulingApi({ sleep: instant });
    const before = await api.getSlots(SCHEDULE_DATE);
    api.setMode('capacity-conflict');

    await expect(api.book({ slotIds: ['a2', 'b1', 'c1'] })).rejects.toMatchObject({
      code: 'SLOT_UNAVAILABLE',
      conflictingSlotIds: ['c1'],
    });

    expect(capacity(before.slots, 'c1')).toBe(1);
    const after = await api.getSlots(SCHEDULE_DATE);
    expect(capacity(after.slots, 'a2')).toBe(1);
    expect(capacity(after.slots, 'b1')).toBe(1);
    expect(capacity(after.slots, 'c1')).toBe(0);
  });

  it('rejects malformed bookings without changing capacity', async () => {
    const api = createInMemorySchedulingApi({ sleep: instant });
    await expect(api.book({ slotIds: ['a2', 'a2'] })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    await expect(api.book({ slotIds: ['missing'] })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    expect(capacity((await api.getSlots(SCHEDULE_DATE)).slots, 'a2')).toBe(1);
  });

  it('restores base capacity and the normal delay sequence', async () => {
    const delays: number[] = [];
    const api = createInMemorySchedulingApi({
      sleep: async (ms) => {
        delays.push(ms);
      },
    });
    api.setMode('out-of-order');
    await api.getSlots(SCHEDULE_DATE);
    await api.book({ slotIds: ['a1'] });
    api.reset();
    api.setMode('out-of-order');
    await api.getSlots(SCHEDULE_DATE);

    expect(delays.at(-1)).toBe(1500);
    expect(capacity((await api.getSlots(SCHEDULE_DATE)).slots, 'a1')).toBe(1);
  });
});

function capacity(slots: readonly { id: string; remainingCapacity: number }[], id: string): number {
  const slot = slots.find((item) => item.id === id);
  if (!slot) throw new Error(`${id} is missing`);
  return slot.remainingCapacity;
}

import assert from 'node:assert/strict';
import test from 'node:test';

import { dueDateKey, localDateKey } from '../utils/date.ts';

test('task dates use the local calendar day across UTC midnight', () => {
  const previousTimezone = process.env.TZ;
  process.env.TZ = 'Asia/Bangkok';
  try {
    const date = new Date('2025-01-01T18:30:00Z');
    assert.equal(localDateKey(date), '2025-01-02');
    assert.equal(dueDateKey(date.toISOString()), '2025-01-02');
    assert.equal(dueDateKey('2025-01-01'), '2025-01-01');
    assert.equal(dueDateKey('invalid'), '');
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});

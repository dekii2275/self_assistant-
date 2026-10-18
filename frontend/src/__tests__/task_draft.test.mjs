import assert from 'node:assert/strict';
import test from 'node:test';

import { prepareTaskText } from '../utils/taskDraft.ts';

test('description-only input becomes a task title', () => {
  assert.deepEqual(prepareTaskText('', 'hahahah'), {
    title: 'hahahah',
    description: undefined,
  });
});

test('a multiline description keeps its details', () => {
  assert.deepEqual(prepareTaskText(' ', 'First line\nSecond line'), {
    title: 'First line',
    description: 'First line\nSecond line',
  });
});

test('an explicit title takes precedence and blank input is rejected', () => {
  assert.deepEqual(prepareTaskText(' Report ', ' Notes '), {
    title: 'Report',
    description: 'Notes',
  });
  assert.equal(prepareTaskText(' ', '\n  '), null);
});

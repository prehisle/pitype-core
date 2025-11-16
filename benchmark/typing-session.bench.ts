import { bench, describe } from 'vitest';
import { TypingSession, createTextSource } from '../packages/pitype-core/src/index.js';

describe('TypingSession Performance', () => {
  bench('create session with 1000 chars', () => {
    const text = 'a'.repeat(1000);
    const textSource = createTextSource(text);
    new TypingSession(textSource);
  });

  bench('process 100 input events', () => {
    const textSource = createTextSource('test text');
    const session = new TypingSession(textSource);
    for (let i = 0; i < 100; i++) {
      session.handleInput('t');
    }
  });
});

import { createTextSource } from './textSource.js';
export class TypingSession {
    constructor(options) {
        this.listeners = new Set();
        this.entries = [];
        this.position = 0;
        this.completed = false;
        const source = options?.source ?? createTextSourceFromOptions(options);
        if (!source) {
            throw new Error('TypingSession requires text or source');
        }
        this.text = source.content;
        this.now = options.now ?? (() => Date.now());
        this.tokens = source.tokens;
        this.locale = source.locale;
        this.sourceId = source.id;
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    getState() {
        return {
            text: this.text,
            position: this.position,
            entries: [...this.entries],
            complete: this.completed,
            sourceId: this.sourceId,
            locale: this.locale
        };
    }
    isComplete() {
        return this.completed;
    }
    input(chars) {
        if (!chars)
            return;
        for (const char of chars) {
            if (this.position >= this.tokens.length) {
                this.completed = true;
                return;
            }
            if (this.startedAt === undefined) {
                this.startSession();
            }
            const expected = this.tokens[this.position]?.char ?? '';
            const timestamp = this.now();
            const correct = this.equalsInput(expected, char);
            const entry = {
                index: this.position,
                expected,
                actual: char,
                correct
            };
            this.entries.push(entry);
            this.position += 1;
            this.emit({ type: 'input:evaluate', timestamp, ...entry });
            if (this.position >= this.tokens.length) {
                this.completed = true;
                this.emit({ type: 'session:complete', timestamp });
                return;
            }
        }
    }
    undo(count = 1) {
        if (count <= 0)
            return;
        while (count-- > 0 && this.entries.length > 0) {
            const entry = this.entries.pop();
            this.position = entry.index;
            this.completed = false;
            const timestamp = this.now();
            this.emit({ type: 'input:undo', timestamp, ...entry });
        }
    }
    reset() {
        this.entries = [];
        this.position = 0;
        this.completed = false;
        this.startedAt = undefined;
        this.emit({ type: 'session:reset', timestamp: this.now() });
    }
    startSession() {
        this.startedAt = this.now();
        this.emit({ type: 'session:start', timestamp: this.startedAt });
    }
    emit(event) {
        this.listeners.forEach(listener => listener(event));
    }
    equalsInput(expected, actual) {
        if (expected === actual)
            return true;
        if (expected === '\n' && (actual === '\n' || actual === '\r'))
            return true;
        return false;
    }
}
function createTextSourceFromOptions(options) {
    if (!options?.text)
        return undefined;
    return createTextSource(options.text, { tokens: options.tokens });
}
export function createStatsTracker(session) {
    return new StatsTrackerImpl(session);
}
class StatsTrackerImpl {
    constructor(session) {
        this.correctChars = 0;
        this.totalChars = 0;
        this.completed = false;
        session.subscribe(event => this.handleEvent(event));
    }
    getSnapshot() {
        const durationMs = this.computeDuration();
        const minutes = durationMs > 0 ? durationMs / 60000 : 0;
        return {
            startedAt: this.startedAt,
            durationMs,
            correctChars: this.correctChars,
            totalChars: this.totalChars,
            accuracy: this.totalChars === 0 ? 100 : Math.round((this.correctChars / this.totalChars) * 100),
            correctCpm: minutes > 0 ? Math.round(this.correctChars / minutes) : 0,
            totalCpm: minutes > 0 ? Math.round(this.totalChars / minutes) : 0,
            wpm: minutes > 0 ? Math.round((this.correctChars / minutes) / 5) : 0,
            completed: this.completed
        };
    }
    handleEvent(event) {
        switch (event.type) {
            case 'session:start':
                this.startedAt = event.timestamp;
                this.lastTimestamp = event.timestamp;
                this.completed = false;
                this.correctChars = 0;
                this.totalChars = 0;
                break;
            case 'input:evaluate':
                this.lastTimestamp = event.timestamp;
                this.totalChars += 1;
                if (event.correct)
                    this.correctChars += 1;
                break;
            case 'input:undo':
                this.lastTimestamp = event.timestamp;
                if (this.totalChars > 0)
                    this.totalChars -= 1;
                if (event.correct && this.correctChars > 0)
                    this.correctChars -= 1;
                this.completed = false;
                break;
            case 'session:complete':
                this.lastTimestamp = event.timestamp;
                this.completed = true;
                break;
            case 'session:reset':
                this.startedAt = undefined;
                this.lastTimestamp = undefined;
                this.totalChars = 0;
                this.correctChars = 0;
                this.completed = false;
                break;
        }
    }
    computeDuration() {
        if (this.startedAt === undefined) {
            return 0;
        }
        const last = this.lastTimestamp ?? this.startedAt;
        return Math.max(0, last - this.startedAt);
    }
}
export * from './tokenizer.js';
export { createTextSource } from './textSource.js';
export { registerLocale, getLocale, getLocaleString } from './locale.js';

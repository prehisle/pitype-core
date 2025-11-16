import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  createRecorder,
  serializeRecording,
  deserializeRecording,
  exportRecordingToFile,
  importRecordingFromFile,
  type RecordingData,
  type Recorder
} from '../src/recorder.js';
import { TypingSession, createTextSource } from '../src';

describe('Recorder', () => {
  let recorder: Recorder;
  let session: TypingSession;
  const textSource = createTextSource('hello world', { locale: 'en-US' });

  beforeEach(() => {
    recorder = createRecorder();
    session = new TypingSession({ source: textSource });
  });

  describe('基本录制功能', () => {
    it('应该能够开始录制', () => {
      expect(recorder.isRecording()).toBe(false);
      recorder.start(session, textSource);
      expect(recorder.isRecording()).toBe(true);
    });

    it('应该在录制过程中记录事件', () => {
      recorder.start(session, textSource);
      session.input('h');
      session.input('e');

      const current = recorder.getCurrentRecording();
      expect(current).toBeDefined();
      expect(current?.events).toHaveLength(3); // session:start + 2 input:evaluate
    });

    it('应该能够停止录制并返回数据', () => {
      recorder.start(session, textSource);
      session.input('hello');

      const recording = recorder.stop();
      expect(recording).toBeDefined();
      expect(recording?.id).toBeDefined();
      expect(recording?.textSource).toEqual(textSource);
      expect(recording?.events.length).toBeGreaterThan(0);
      expect(recording?.startTime).toBeDefined();
      expect(recording?.endTime).toBeDefined();
    });

    it('应该在停止录制后清除状态', () => {
      recorder.start(session, textSource);
      session.input('h');
      recorder.stop();

      expect(recorder.isRecording()).toBe(false);
      expect(recorder.getCurrentRecording()).toBeNull();
    });

    it('应该忽略重复的开始录制请求', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      recorder.start(session, textSource);
      const firstRecording = recorder.getCurrentRecording();

      recorder.start(session, textSource);
      const secondRecording = recorder.getCurrentRecording();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Recording already in progress. Stop current recording first.'
      );
      expect(firstRecording?.id).toBe(secondRecording?.id);

      consoleSpy.mockRestore();
    });

    it('应该在未开始录制时返回 null', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const recording = recorder.stop();
      expect(recording).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('No recording in progress.');

      consoleSpy.mockRestore();
    });
  });

  describe('录制选项', () => {
    it('应该支持自定义录制 ID', () => {
      const customId = 'my-custom-id';
      recorder = createRecorder({ id: customId });

      recorder.start(session, textSource);
      const recording = recorder.stop();

      expect(recording?.id).toBe(customId);
    });

    it('应该在包含元数据时添加元数据', () => {
      recorder = createRecorder({ includeMetadata: true });

      recorder.start(session, textSource);
      session.input('test');
      const recording = recorder.stop();

      expect(recording?.metadata).toBeDefined();
      expect(recording?.metadata?.version).toBe('1.0.0');
      expect(recording?.metadata?.duration).toBeDefined();
      expect(recording?.metadata?.eventCount).toBeDefined();
    });

    it('应该在禁用元数据时不添加元数据', () => {
      recorder = createRecorder({ includeMetadata: false });

      recorder.start(session, textSource);
      session.input('test');
      const recording = recorder.stop();

      expect(recording?.metadata).toBeUndefined();
    });

    it('应该支持自定义元数据', () => {
      const customMetadata = { userId: '123', sessionId: 'abc' };
      recorder = createRecorder({
        includeMetadata: true,
        customMetadata
      });

      recorder.start(session, textSource);
      const recording = recorder.stop();

      expect(recording?.metadata?.userId).toBe('123');
      expect(recording?.metadata?.sessionId).toBe('abc');
    });
  });

  describe('getCurrentRecording', () => {
    it('应该在录制中返回当前录制数据', () => {
      recorder.start(session, textSource);
      session.input('hi');

      const current = recorder.getCurrentRecording();
      expect(current).toBeDefined();
      expect(current?.id).toBeDefined();
      expect(current?.textSource).toEqual(textSource);
      expect(current?.events.length).toBeGreaterThan(0);
      expect(current?.startTime).toBeDefined();
    });

    it('应该在未录制时返回 null', () => {
      const current = recorder.getCurrentRecording();
      expect(current).toBeNull();
    });
  });

  describe('clear', () => {
    it('应该清除所有录制状态', () => {
      recorder.start(session, textSource);
      session.input('test');

      recorder.clear();

      expect(recorder.isRecording()).toBe(false);
      expect(recorder.getCurrentRecording()).toBeNull();
    });

    it('应该取消事件订阅', () => {
      recorder.start(session, textSource);
      recorder.clear();

      // 清除后添加事件不应该被记录
      session.input('test');

      recorder.start(session, textSource);
      const current = recorder.getCurrentRecording();
      expect(current?.events).toHaveLength(0);
    });
  });

  describe('finalStats', () => {
    it('应该在停止时包含最终统计数据', () => {
      recorder.start(session, textSource);
      session.input('hello');

      const finalStats = {
        correctChars: 5,
        totalChars: 5,
        accuracy: 100,
        correctCpm: 60,
        totalCpm: 60,
        wpm: 1,
        durationMs: 5000
      };

      const recording = recorder.stop(finalStats);
      expect(recording?.finalStats).toEqual(finalStats);
    });
  });
});

describe('serializeRecording / deserializeRecording', () => {
  it('应该能够序列化和反序列化录制数据', () => {
    const recording: RecordingData = {
      id: 'test-id',
      textSource: createTextSource('test'),
      events: [
        { type: 'session:start', timestamp: 1000 },
        { type: 'input:evaluate', timestamp: 1100, index: 0, expected: 't', actual: 't', correct: true }
      ],
      startTime: 1000,
      endTime: 2000,
      metadata: { version: '1.0.0' }
    };

    const serialized = serializeRecording(recording);
    const deserialized = deserializeRecording(serialized);

    expect(deserialized).toEqual(recording);
    expect(deserialized.id).toBe(recording.id);
    expect(deserialized.events).toHaveLength(recording.events.length);
  });
});

describe('exportRecordingToFile', () => {
  it('应该在非浏览器环境抛出错误', () => {
    const recording: RecordingData = {
      id: 'test-id',
      textSource: createTextSource('test'),
      events: [],
      startTime: 1000,
      endTime: 2000
    };

    // Node 环境中没有 window 对象
    expect(() => exportRecordingToFile(recording)).toThrow(
      'File export is only available in browser environments'
    );
  });
});

describe('importRecordingFromFile', () => {
  it.skip('应该能够从文件导入录制数据（浏览器环境）', async () => {
    // 此测试需要浏览器环境（FileReader），在 Node 环境中跳过
    const recording: RecordingData = {
      id: 'test-id',
      textSource: createTextSource('test'),
      events: [
        { type: 'session:start', timestamp: 1000 }
      ],
      startTime: 1000,
      endTime: 2000
    };

    const json = serializeRecording(recording);
    const blob = new Blob([json], { type: 'application/json' });
    const file = new File([blob], 'recording.json', { type: 'application/json' });

    const imported = await importRecordingFromFile(file);
    expect(imported.id).toBe(recording.id);
    expect(imported.events).toHaveLength(recording.events.length);
  });

  it.skip('应该在文件格式错误时拒绝（浏览器环境）', async () => {
    // 此测试需要浏览器环境（FileReader），在 Node 环境中跳过
    const blob = new Blob(['invalid json'], { type: 'application/json' });
    const file = new File([blob], 'invalid.json', { type: 'application/json' });

    await expect(importRecordingFromFile(file)).rejects.toThrow('Failed to parse recording file');
  });
});

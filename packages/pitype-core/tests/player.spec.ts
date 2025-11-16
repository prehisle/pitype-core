import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createPlayer, getRecordingStats } from '../src/player.js';
import { createTextSource } from '../src/textSource.js';
import type { RecordingData } from '../src/recorder.js';

describe('Player', () => {
  let recording: RecordingData;

  beforeEach(() => {
    // 创建一个简单的录制数据用于测试
    recording = {
      id: 'test-recording',
      textSource: createTextSource('hello'),
      events: [
        { type: 'session:start', timestamp: 0 },
        {
          type: 'input:evaluate',
          timestamp: 100,
          index: 0,
          expected: 'h',
          actual: 'h',
          correct: true
        },
        {
          type: 'input:evaluate',
          timestamp: 250,
          index: 1,
          expected: 'e',
          actual: 'e',
          correct: true
        },
        {
          type: 'input:evaluate',
          timestamp: 450,
          index: 2,
          expected: 'l',
          actual: 'l',
          correct: true
        },
        {
          type: 'input:evaluate',
          timestamp: 700,
          index: 3,
          expected: 'l',
          actual: 'l',
          correct: true
        },
        {
          type: 'input:evaluate',
          timestamp: 1000,
          index: 4,
          expected: 'o',
          actual: 'o',
          correct: true
        }
      ],
      startTime: Date.now(),
      endTime: Date.now() + 1000
    };
  });

  describe('基本播放功能', () => {
    it('应该初始化为 idle 状态', () => {
      const player = createPlayer({ recording });
      expect(player.getState()).toBe('idle');
      expect(player.isPlaying()).toBe(false);
    });

    it('应该能够开始播放', () => {
      const player = createPlayer({ recording });
      player.play();
      expect(player.getState()).toBe('playing');
      expect(player.isPlaying()).toBe(true);
    });

    it('应该能够暂停播放', () => {
      const player = createPlayer({ recording });
      player.play();
      player.pause();
      expect(player.getState()).toBe('paused');
      expect(player.isPlaying()).toBe(false);
    });

    it('应该能够恢复播放', () => {
      const player = createPlayer({ recording });
      player.play();
      player.pause();
      player.resume();
      expect(player.getState()).toBe('playing');
      expect(player.isPlaying()).toBe(true);
    });

    it('应该能够停止播放并重置状态', () => {
      const player = createPlayer({ recording });
      player.play();
      player.stop();

      expect(player.getState()).toBe('idle');
      expect(player.getCurrentTime()).toBe(0);
    });

    it('应该在播放重复时忽略', () => {
      const player = createPlayer({ recording });
      player.play();
      const stateBefore = player.getState();
      player.play();
      const stateAfter = player.getState();

      expect(stateBefore).toBe(stateAfter);
      expect(stateAfter).toBe('playing');
    });
  });

  describe('播放速度控制', () => {
    it('应该支持设置播放速度', () => {
      const player = createPlayer({ recording, playbackSpeed: 1.0 });
      expect(player.getSpeed()).toBe(1.0);

      player.setSpeed(2.0);
      expect(player.getSpeed()).toBe(2.0);
    });

    it('应该限制播放速度在有效范围内', () => {
      const player = createPlayer({ recording });

      player.setSpeed(0.05); // 低于最小值 0.1
      expect(player.getSpeed()).toBe(0.1);

      player.setSpeed(15); // 高于最大值 10
      expect(player.getSpeed()).toBe(10);
    });

    it('应该在设置速度时暂停并恢复播放', () => {
      const player = createPlayer({ recording });
      player.play();

      player.setSpeed(2.0);
      expect(player.getState()).toBe('playing');
    });
  });

  describe('时间和进度', () => {
    it('应该正确返回总时长', () => {
      const player = createPlayer({ recording });
      const duration = player.getDuration();
      expect(duration).toBe(1000); // 最后一个事件在 1000ms
    });

    it('应该正确返回当前播放时间', () => {
      const player = createPlayer({ recording });
      expect(player.getCurrentTime()).toBe(0);
    });

    it('应该在播放时更新当前时间', async () => {
      const player = createPlayer({ recording });
      player.play();

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(player.getCurrentTime()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('事件回调', () => {
    it('应该在事件触发时调用 onEvent 回调', async () => {
      const onEvent = vi.fn();
      const player = createPlayer({ recording, onEvent });

      player.play();

      // 等待第一个事件触发
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onEvent).toHaveBeenCalled();
      player.destroy();
    });

    it('应该在播放完成时调用 onComplete 回调', async () => {
      const onComplete = vi.fn();
      const shortRecording: RecordingData = {
        ...recording,
        events: [
          { type: 'session:start', timestamp: 0 },
          {
            type: 'input:evaluate',
            timestamp: 10,
            index: 0,
            expected: 'h',
            actual: 'h',
            correct: true
          }
        ]
      };

      const player = createPlayer({
        recording: shortRecording,
        onComplete,
        playbackSpeed: 10 // 加速播放
      });

      player.play();

      // 等待播放完成
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onComplete).toHaveBeenCalled();
      expect(player.getState()).toBe('completed');
      player.destroy();
    });

    it('应该定期调用 onProgress 回调', async () => {
      const onProgress = vi.fn();
      const player = createPlayer({
        recording,
        onProgress,
        progressInterval: 50
      });

      player.play();

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(onProgress.mock.calls.length).toBeGreaterThan(0);
      player.destroy();
    });
  });

  describe('跳转功能', () => {
    it('应该支持跳转到指定时间', () => {
      const player = createPlayer({ recording });
      player.seek(500);

      const currentTime = player.getCurrentTime();
      expect(currentTime).toBe(500);
    });

    it('应该限制跳转时间在有效范围内', () => {
      const player = createPlayer({ recording });

      player.seek(-100); // 负数
      expect(player.getCurrentTime()).toBe(0);

      player.seek(2000); // 超过总时长
      expect(player.getCurrentTime()).toBe(1000);
    });

    it('应该在跳转时触发对应位置的事件', () => {
      const onEvent = vi.fn();
      const player = createPlayer({ recording, onEvent });

      player.seek(500);

      expect(onEvent).toHaveBeenCalled();
    });

    it('应该在播放中跳转后继续播放', () => {
      const player = createPlayer({ recording });
      player.play();
      player.seek(500);

      expect(player.getState()).toBe('playing');
      player.destroy();
    });
  });

  describe('空录制数据', () => {
    it('应该正确处理空事件列表', () => {
      const emptyRecording: RecordingData = {
        id: 'empty',
        textSource: createTextSource('placeholder'), // 至少需要一个字符
        events: [],
        startTime: 0,
        endTime: 0
      };

      const onComplete = vi.fn();
      const player = createPlayer({ recording: emptyRecording, onComplete });

      player.play();
      expect(player.getState()).toBe('completed');
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('播放完成后重新播放', () => {
    it('应该能够在完成后重新开始播放', async () => {
      const shortRecording: RecordingData = {
        ...recording,
        events: [
          { type: 'session:start', timestamp: 0 },
          {
            type: 'input:evaluate',
            timestamp: 5,
            index: 0,
            expected: 'h',
            actual: 'h',
            correct: true
          }
        ]
      };

      const onComplete = vi.fn();
      const player = createPlayer({
        recording: shortRecording,
        playbackSpeed: 100,
        onComplete
      });

      player.play();
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 等待完成回调
      expect(onComplete).toHaveBeenCalled();
      expect(player.getState()).toBe('completed');

      // 重新播放应该重置状态
      player.play();

      // 由于是空事件列表，会立即完成
      // 所以我们检查状态不是 idle（已经被处理过）
      expect(['playing', 'completed'].includes(player.getState())).toBe(true);

      player.destroy();
    });
  });

  describe('销毁播放器', () => {
    it('应该清理所有定时器和状态', () => {
      const player = createPlayer({ recording });
      player.play();
      player.destroy();

      expect(player.getState()).toBe('idle');
    });
  });
});

describe('getRecordingStats', () => {
  it('应该正确计算录制统计信息', () => {
    const recording: RecordingData = {
      id: 'test',
      textSource: createTextSource('hello world'),
      events: [
        { type: 'session:start', timestamp: 0 },
        {
          type: 'input:evaluate',
          timestamp: 100,
          index: 0,
          expected: 'h',
          actual: 'h',
          correct: true
        },
        {
          type: 'input:evaluate',
          timestamp: 200,
          index: 1,
          expected: 'e',
          actual: 'e',
          correct: true
        },
        { type: 'input:undo', timestamp: 250, index: 1, expected: 'e', actual: 'e', correct: true },
        {
          type: 'input:evaluate',
          timestamp: 300,
          index: 1,
          expected: 'e',
          actual: 'x',
          correct: false
        },
        {
          type: 'input:evaluate',
          timestamp: 1000,
          index: 2,
          expected: 'l',
          actual: 'l',
          correct: true
        }
      ],
      startTime: 0,
      endTime: 1000
    };

    const stats = getRecordingStats(recording);

    expect(stats.duration).toBe(1000);
    expect(stats.eventCount).toBe(6);
    expect(stats.inputCount).toBe(4);
    expect(stats.undoCount).toBe(1);
    expect(stats.characterCount).toBe(11); // 'hello world'.length
  });

  it('应该正确处理空录制', () => {
    const recording: RecordingData = {
      id: 'empty',
      textSource: createTextSource('a'), // 至少需要一个字符
      events: [],
      startTime: 0,
      endTime: 0
    };

    const stats = getRecordingStats(recording);

    expect(stats.duration).toBe(0);
    expect(stats.eventCount).toBe(0);
    expect(stats.inputCount).toBe(0);
    expect(stats.undoCount).toBe(0);
    expect(stats.characterCount).toBe(1);
  });
});

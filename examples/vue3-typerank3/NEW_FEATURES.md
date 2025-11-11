# Vue3 TypeRank3 新功能说明

本示例项目已经集成了 Pitype Core 的三个新个性化配置功能：

## 🎨 1. 光标形状配置

在设置面板中，你可以：

- **选择光标形状**: 方块、竖线、下划线、轮廓
- **自定义光标颜色**: 使用颜色选择器选择任何颜色
- **启用光标闪烁**: 开关光标闪烁动画

所有配置会自动保存到 localStorage，下次访问时自动恢复。

### 使用方法

1. 点击页面右上角的"设置"按钮
2. 在"光标设置"部分调整配置
3. 配置会立即生效

## 🔊 2. 按键声音反馈

在设置面板中，你可以：

- **启用/禁用音效**: 一键切换
- **调节音量**: 0-100% 精确控制

### 音效文件配置

**注意**: 当前示例使用的是占位音效。要启用真实的音效，需要：

1. 准备 4 个音效文件：
   - `keypress.mp3` - 按键音
   - `correct.mp3` - 正确音
   - `error.mp3` - 错误音
   - `complete.mp3` - 完成音

2. 将文件放到 `public/sounds/` 目录

3. 修改 `src/App.vue` 中的音频控制器配置：

```typescript
audioController.value = createDomAudioController({
  soundPack: {
    keyPress: '/sounds/keypress.mp3',
    correct: '/sounds/correct.mp3',
    error: '/sounds/error.mp3',
    complete: '/sounds/complete.mp3'
  },
  enabled: audioEnabled.value,
  volume: audioVolume.value
});
```

### 推荐音效资源

- [Freesound.org](https://freesound.org/)
- [Zapsplat.com](https://www.zapsplat.com/)
- [Mixkit.co](https://mixkit.co/free-sound-effects/)

## 🎬 3. 练习回放功能

每次完成练习后，系统会自动录制整个打字过程。在设置面板中，你可以：

- **播放回放**: 按照原始速度重现打字过程
- **调整速度**: 0.5x - 5x 倍速播放
- **导出录制**: 保存为 JSON 文件，可以分享或备份

### 使用方法

1. 完成一次打字练习
2. 点击"设置"按钮
3. 在"练习回放"部分：
   - 点击"播放"观看回放
   - 拖动速度滑块调整播放速度
   - 点击"导出"保存录制数据
   - 点击"停止"结束回放

### 录制数据格式

导出的 JSON 文件包含：
- 文本源信息
- 完整的事件序列（带时间戳）
- 最终统计数据
- 元数据（浏览器信息、事件数量等）

## 🚀 快速体验

1. 启动开发服务器：
```bash
npm run dev
```

2. 打开浏览器访问 `http://localhost:4175`

3. 点击右上角的"设置"按钮体验新功能

## 📝 技术实现

所有功能都基于 `@pitype/core` 核心库实现：

```typescript
import {
  createDomCursorAdapter,     // 光标适配器
  createDomAudioController,    // 音频控制器
  createSessionRuntime,        // 会话运行时（集成录制）
  createPlayer,                // 回放播放器
  type CursorShape,
  type RecordingData
} from '@pitype/core';
```

### 核心代码片段

#### 光标配置
```typescript
const cursorAdapter = createDomCursorAdapter({
  // ... 其他配置
  cursorShape: 'line',
  cursorColor: '#61dafb',
  cursorBlinkEnabled: true
});

// 动态修改
cursorAdapter.setCursorShape('outline');
```

#### 音频反馈
```typescript
const audioController = createDomAudioController({
  soundPack: { /* ... */ },
  enabled: true,
  volume: 0.7
});

// SessionRuntime 自动集成
const sessionRuntime = createSessionRuntime({
  audioController: audioController,  // 自动触发音效
  enableRecording: true              // 自动录制
});
```

#### 练习回放
```typescript
// 获取录制数据
const recording = sessionRuntime.getLastRecording();

// 创建播放器
const player = createPlayer({
  recording: recording,
  playbackSpeed: 1.0,
  onEvent: (event) => {
    // 重现打字效果
  }
});

player.play();
```

## 🎯 功能特点

### 光标配置
- ✅ 4 种形状可选
- ✅ 无限颜色自定义
- ✅ 闪烁效果可控
- ✅ 配置自动持久化

### 音频反馈
- ✅ 4 种音效独立控制
- ✅ 音效池技术，支持快速连续按键
- ✅ 音量精确控制
- ✅ 配置自动持久化

### 练习回放
- ✅ 自动录制每次练习
- ✅ 毫秒级精确回放
- ✅ 0.5x - 5x 倍速播放
- ✅ 支持导出分享

## 📚 更多文档

完整的 API 文档和使用指南：

- [光标配置指南](../../packages/pitype-core/CURSOR_CONFIG_GUIDE.md)
- [音频控制指南](../../packages/pitype-core/AUDIO_CONTROLLER_GUIDE.md)
- [回放功能指南](../../packages/pitype-core/PLAYBACK_GUIDE.md)

## 🐛 已知问题

1. **音效占位符**: 当前使用的是 base64 编码的占位音效，实际使用需要替换为真实音效文件
2. **移动端兼容**: 某些移动浏览器可能不支持自动播放音效，需要用户交互后才能启用

## 🤝 贡献

欢迎提交问题和改进建议到 [GitHub Issues](https://github.com/anthropics/pitype-core/issues)

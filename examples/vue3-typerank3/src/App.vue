<template>
  <div class="app">
    <header class="header">
      <h1>TypeFree <span class="version">Vue3</span></h1>
      <div class="controls">
        <div class="selector-container">
          <div class="language-selector">
            <button
              v-for="lang in languages"
              :key="lang"
              class="language-option"
              :class="{ active: activeLanguage === lang }"
              @click="switchLanguage(lang)"
            >
              {{ lang }}
            </button>
          </div>
          <div class="selector-divider" />
          <div class="theme-selector">
            <button
              v-for="theme in themes"
              :key="theme"
              class="theme-option"
              :data-theme="theme"
              :class="{ active: activeTheme === theme }"
              @click="switchTheme(theme)"
            />
          </div>
        </div>
        <button id="restart-btn" @click="restartSession">
          <i class="fas fa-redo" /> 重新开始
        </button>
        <button @click="toggleSettings" class="settings-btn">
          <i class="fas fa-cog" /> 设置
        </button>
      </div>
    </header>

    <!-- 设置面板 -->
    <div v-if="showSettings" class="settings-panel">
      <div class="settings-content">
        <h3>个性化设置</h3>

        <!-- 光标设置 -->
        <section class="settings-section">
          <h4><i class="fas fa-i-cursor" /> 光标设置</h4>
          <div class="setting-item">
            <label>光标形状:</label>
            <select :value="cursorShape" @change="updateCursorShape(($event.target as HTMLSelectElement).value as CursorShape)">
              <option value="block">方块</option>
              <option value="line">竖线</option>
              <option value="underline">下划线</option>
              <option value="outline">轮廓</option>
            </select>
          </div>
          <div class="setting-item">
            <label>光标颜色:</label>
            <input type="color" :value="cursorColor" @input="updateCursorColor(($event.target as HTMLInputElement).value)" />
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" :checked="cursorBlink" @change="toggleCursorBlink" />
              启用闪烁
            </label>
          </div>
        </section>

        <!-- 音频设置 -->
        <section class="settings-section">
          <h4><i class="fas fa-volume-up" /> 音频设置</h4>
          <div class="setting-item">
            <label>
              <input type="checkbox" :checked="audioEnabled" @change="toggleAudio" />
              启用音效
            </label>
          </div>
          <div class="setting-item">
            <label>音量: {{ Math.round(audioVolume * 100) }}%</label>
            <input
              type="range"
              min="0"
              max="100"
              :value="audioVolume * 100"
              @input="updateVolume"
              :disabled="!audioEnabled"
            />
          </div>
          <p class="hint">注意: 需要准备音效文件才能听到声音</p>
        </section>

        <!-- 回放控制 -->
        <section class="settings-section">
          <h4><i class="fas fa-play-circle" /> 练习回放</h4>
          <div class="setting-item" v-if="currentRecording">
            <p>已录制练习 ({{ currentRecording.events.length }} 个事件)</p>
            <div class="playback-controls">
              <button @click="playRecording" :disabled="isPlayingBack">
                <i class="fas fa-play" /> 播放
              </button>
              <button @click="stopPlayback" :disabled="!isPlayingBack">
                <i class="fas fa-stop" /> 停止
              </button>
              <button @click="saveRecording">
                <i class="fas fa-download" /> 导出
              </button>
            </div>
            <div class="setting-item" v-if="isPlayingBack">
              <label>播放速度: {{ playbackSpeed }}x</label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                v-model.number="playbackSpeed"
                @input="updatePlaybackSpeed"
              />
            </div>
          </div>
          <p v-else class="hint">完成一次练习后可以回放</p>
        </section>

        <!-- 幽灵光标管理 -->
        <section class="settings-section">
          <h4><i class="fas fa-ghost" /> 幽灵光标对战</h4>
          <div class="setting-item">
            <p class="hint">添加历史录制作为幽灵，与它们同时打字！</p>

            <div v-if="savedRecordings.length > 0">
              <label>选择幽灵:</label>
              <div class="ghost-list">
                <div
                  v-for="(recording, index) in savedRecordings"
                  :key="index"
                  class="ghost-item"
                >
                  <label class="ghost-checkbox">
                    <input
                      type="checkbox"
                      :checked="isGhostEnabled(index)"
                      @change="toggleGhost(index)"
                    />
                    <span class="ghost-info">
                      <span class="ghost-name">{{ getGhostName(index) }}</span>
                      <span class="ghost-stats">
                        {{ recording.events.length }} 个事件
                      </span>
                    </span>
                  </label>
                  <input
                    type="color"
                    :value="getGhostColor(index)"
                    @input="updateGhostColor(index, ($event.target as HTMLInputElement).value)"
                    class="ghost-color-picker"
                    title="选择光标颜色"
                  />
                </div>
              </div>

              <div v-if="activeGhosts.length > 0" class="ghost-controls">
                <p>{{ activeGhosts.length }} 个幽灵已激活</p>
                <label>
                  <input type="checkbox" v-model="showGhostLabels" />
                  显示幽灵名称标签
                </label>
              </div>
            </div>
            <p v-else class="hint">保存一些录制后可以添加幽灵</p>
          </div>
        </section>

        <button @click="toggleSettings" class="close-btn">关闭</button>
      </div>
    </div>

    <section class="stats">
      <div class="cpm-container">
        <span class="cpm-label">
          <span class="info-text" data-info="cpm">CPM:</span>
        </span>
        <div class="cpm-values">
          <span id="cpm" class="cpm-value">0</span>
          <span id="total-cpm" class="tcpm-value">0</span>
          <span id="wpm" class="wpm-value">0</span>
        </div>
      </div>
      <div class="stat-item">
        正确率: <span id="accuracy" class="stat-value">100%</span>
      </div>
      <div class="stat-item">
        时间: <span id="time" class="stat-value">0.0 秒</span>
      </div>
      <div class="stat-item">
        字符数: <span id="char-count" class="stat-value">0</span>
      </div>
    </section>

    <section class="text-container" ref="textContainerRef" @click="focusInput">
      <div v-if="initError" class="overlay error-message">
        <i class="fas fa-exclamation-circle" /> {{ initError }}
      </div>
      <div v-else-if="isLoading" class="overlay loading-message">
        <i class="fas fa-spinner fa-spin" /> 加载中...
      </div>
      <div ref="textDisplayRef" class="text-display" :class="{ hidden: initError || isLoading }">
        <input
          ref="hiddenInputRef"
          id="input-field"
          type="text"
          autocomplete="off"
        />
        <div ref="cursorRef" class="cursor" />
      </div>
    </section>

    <div v-if="showResult" class="modal">
      <div class="modal-content">
        <h2><i class="fas fa-trophy" /> 练习完成！</h2>
        <div class="result-stats">
          <p><span class="stat-label">总用时:</span> <span id="final-time"></span></p>
          <p><span class="stat-label">CPM:</span> <span id="final-cpm"></span></p>
          <p><span class="stat-label">总CPM:</span> <span id="final-total-cpm"></span></p>
          <p><span class="stat-label">WPM:</span> <span id="final-wpm"></span></p>
          <p><span class="stat-label">正确率:</span> <span id="final-accuracy"></span></p>
          <p><span class="stat-label">总字符数:</span> <span id="final-char-count"></span></p>
        </div>
        <button class="modal-button" @click="closeResult">继续练习</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, nextTick, computed } from 'vue';
import {
  createSessionRuntime,
  createTextSource,
  createDomCursorAdapter,
  createDomInputController,
  createDomTextRenderer,
  createDomStatsPanel,
  createDomAudioController,
  createPlayer,
  createGhostManager,
  exportRecordingToFile,
  type CursorShape,
  type RecordingData,
  type Player,
  type GhostManager
} from '@pitype/core';
import { texts, type Language } from './texts';

const textContainerRef = ref<HTMLElement | null>(null);
const textDisplayRef = ref<HTMLElement | null>(null);
const cursorRef = ref<HTMLElement | null>(null);
const hiddenInputRef = ref<HTMLInputElement | null>(null);

const themes = ['dracula', 'serika', 'botanical', 'aether', 'nord'] as const;
const languages: Language[] = ['zh-CN', 'zh-TW', 'en-US'];
const activeLanguage = ref<Language>('zh-CN');
const activeTheme = ref<string>('dracula');
const showResult = ref(false);
const textIndex = ref(0);
const isLoading = ref(true);
const initError = ref<string | null>(null);

const textRenderer = shallowRef<ReturnType<typeof createDomTextRenderer>>();
const cursorAdapter = shallowRef<ReturnType<typeof createDomCursorAdapter>>();
const inputController = shallowRef<ReturnType<typeof createDomInputController>>();
const statsPanel = shallowRef<ReturnType<typeof createDomStatsPanel>>();
const audioController = shallowRef<ReturnType<typeof createDomAudioController>>();
const player = shallowRef<Player | null>(null);
const ghostManager = shallowRef<GhostManager | null>(null);

// 光标配置状态
const cursorShape = ref<CursorShape>('block');
const cursorColor = ref('#ffd700');
const cursorBlink = ref(false);

// 音频配置状态
const audioEnabled = ref(false);
const audioVolume = ref(0.5);

// 录制和回放状态
const currentRecording = ref<RecordingData | null>(null);
const isPlayingBack = ref(false);
const playbackSpeed = ref(1.0);
const showSettings = ref(false);

// 幽灵光标状态
const savedRecordings = ref<RecordingData[]>([]);
const activeGhosts = ref<number[]>([]);  // 激活的幽灵索引
const ghostColors = ref<string[]>([]);   // 每个幽灵的颜色
const showGhostLabels = ref(true);       // 是否显示幽灵名称标签

const GHOST_COLOR_PALETTE = [
  'rgba(255, 99, 132, 0.8)',   // 粉红
  'rgba(54, 162, 235, 0.8)',   // 蓝色
  'rgba(255, 206, 86, 0.8)',   // 黄色
  'rgba(75, 192, 192, 0.8)',   // 青色
  'rgba(153, 102, 255, 0.8)',  // 紫色
];

let sessionRuntime: ReturnType<typeof createSessionRuntime>;

function handleEvaluate(event: { index: number; correct: boolean }) {
  textRenderer.value?.applySpanState(event.index, event.correct);
  cursorAdapter.value?.scheduleRefresh();
}

function handleUndo(event: { index: number }) {
  textRenderer.value?.resetSpanState(event.index);
  cursorAdapter.value?.scheduleRefresh();
}

function focusInput() {
  hiddenInputRef.value?.focus();
}

function restartSession() {
  const langTexts = texts[activeLanguage.value];
  textIndex.value = Math.floor(Math.random() * langTexts.length);
  startSession();
}

function closeResult() {
  showResult.value = false;
  restartSession();
}

async function startSession() {
  try {
    const langTexts = texts[activeLanguage.value];
    if (!langTexts || langTexts.length === 0) {
      throw new Error(`没有可用的 ${activeLanguage.value} 文本`);
    }

    const source = createTextSource(langTexts[textIndex.value], {
      id: `text-${textIndex.value}`,
      locale: activeLanguage.value
    });

    // 渲染文本（preserveChildren: true 会保留 input 和 cursor 元素）
    textRenderer.value?.render(source);

    // 先显示文本，移除加载状态
    isLoading.value = false;

    // 等待 Vue DOM 更新完成
    await nextTick();

    // 缓存所有字符元素
    cursorAdapter.value?.cacheCharSpans();

    // 检查是否成功获取到 spans
    const spans = textRenderer.value?.getSpans() ?? [];
    if (spans.length === 0) {
      console.error('未找到任何字符元素，无法定位光标');
      return;
    }

    // 启动会话
    sessionRuntime.startSession(source);

    // 确保光标定位准确
    cursorAdapter.value?.updatePosition({ immediate: true });

    // 设置移动设备支持
    cursorAdapter.value?.enableMobileSupport();

    // 监听尺寸变化，保持光标位置随容器更新
    cursorAdapter.value?.enableResponsiveSync();

    // 初始化幽灵光标
    if (activeGhosts.value.length > 0) {
      initializeGhosts();
      // 启动所有幽灵
      ghostManager.value?.startAll();
    }

    // 聚焦输入框
    focusInput();
  } catch (error) {
    initError.value = error instanceof Error ? error.message : '初始化失败';
    isLoading.value = false;
    console.error('启动会话失败:', error);
  }
}

function switchTheme(theme: string) {
  activeTheme.value = theme;
  // 移除所有主题类
  themes.forEach(t => {
    document.body.classList.remove(`theme-${t}`);
  });
  // 添加新主题类
  document.body.classList.add(`theme-${theme}`);
}

function switchLanguage(lang: string) {
  activeLanguage.value = lang as Language;
  restartSession();
}

// 光标配置函数
function updateCursorShape(shape: CursorShape) {
  cursorShape.value = shape;
  cursorAdapter.value?.setCursorShape(shape);
}

function updateCursorColor(color: string) {
  cursorColor.value = color;
  cursorAdapter.value?.setCursorColor(color);
}

function toggleCursorBlink() {
  cursorBlink.value = !cursorBlink.value;
  cursorAdapter.value?.setCursorBlink(cursorBlink.value);
}

// 音频配置函数
function toggleAudio() {
  if (audioController.value) {
    const newState = audioController.value.toggle();
    audioEnabled.value = newState;
  }
}

function updateVolume(event: Event) {
  const value = (event.target as HTMLInputElement).valueAsNumber / 100;
  audioVolume.value = value;
  audioController.value?.setVolume(value);
}

// 回放控制函数
function playRecording() {
  if (!currentRecording.value || isPlayingBack.value) return;

  // 停止当前会话
  if (player.value) {
    player.value.destroy();
  }

  // 渲染录制的文本
  textRenderer.value?.render(currentRecording.value.textSource);
  cursorAdapter.value?.cacheCharSpans();

  // 创建播放器
  player.value = createPlayer({
    recording: currentRecording.value,
    playbackSpeed: playbackSpeed.value,
    onEvent: (event) => {
      if (event.type === 'input:evaluate') {
        textRenderer.value?.applySpanState(event.index, event.correct);
        cursorAdapter.value?.updatePosition({ immediate: false });
      } else if (event.type === 'input:undo') {
        textRenderer.value?.resetSpanState(event.index);
        cursorAdapter.value?.updatePosition({ immediate: false });
      }
    },
    onComplete: () => {
      isPlayingBack.value = false;
    }
  });

  player.value.play();
  isPlayingBack.value = true;
}

function stopPlayback() {
  player.value?.stop();
  player.value?.destroy();
  player.value = null;
  isPlayingBack.value = false;
  restartSession();
}

function updatePlaybackSpeed() {
  player.value?.setSpeed(playbackSpeed.value);
}

function saveRecording() {
  if (currentRecording.value) {
    exportRecordingToFile(currentRecording.value);
  }
}

function toggleSettings() {
  showSettings.value = !showSettings.value;
}

// 幽灵光标管理函数
function getGhostName(index: number): string {
  const recording = savedRecordings.value[index];
  return `幽灵 #${index + 1}`;
}

function getGhostColor(index: number): string {
  if (!ghostColors.value[index]) {
    ghostColors.value[index] = GHOST_COLOR_PALETTE[index % GHOST_COLOR_PALETTE.length];
  }
  return ghostColors.value[index];
}

function updateGhostColor(index: number, color: string) {
  ghostColors.value[index] = color;
}

function isGhostEnabled(index: number): boolean {
  return activeGhosts.value.includes(index);
}

function toggleGhost(index: number) {
  const ghostIndex = activeGhosts.value.indexOf(index);
  if (ghostIndex > -1) {
    // 移除幽灵
    activeGhosts.value.splice(ghostIndex, 1);
  } else {
    // 添加幽灵
    activeGhosts.value.push(index);
  }
}

function initializeGhosts() {
  if (!ghostManager.value || activeGhosts.value.length === 0) return;

  // 清除旧的幽灵
  ghostManager.value.destroy();

  // 创建新的 GhostManager
  ghostManager.value = createGhostManager({
    textDisplay: textDisplayRef.value!,
    textContainer: textContainerRef.value!,
    getSpans: () => textRenderer.value?.getSpans() ?? []
  });

  // 添加激活的幽灵
  activeGhosts.value.forEach(index => {
    const recording = savedRecordings.value[index];
    ghostManager.value!.addGhost({
      name: getGhostName(index),
      recording: recording,
      color: getGhostColor(index),
      shape: 'line',
      showLabel: showGhostLabels.value
    });
  });
}

function loadSavedRecordings() {
  try {
    const saved = localStorage.getItem('savedRecordings');
    if (saved) {
      savedRecordings.value = JSON.parse(saved);
    }
  } catch (error) {
    console.error('加载录制失败:', error);
  }
}

function saveRecordingToHistory() {
  if (!currentRecording.value) return;

  // 添加到历史
  savedRecordings.value.push(currentRecording.value);

  // 最多保存 10 个录制
  if (savedRecordings.value.length > 10) {
    savedRecordings.value.shift();
  }

  // 保存到 localStorage
  try {
    localStorage.setItem('savedRecordings', JSON.stringify(savedRecordings.value));
  } catch (error) {
    console.error('保存录制失败:', error);
  }
}

onMounted(() => {
  try {
    if (!textDisplayRef.value || !textContainerRef.value || !cursorRef.value) {
      throw new Error('DOM 元素未正确初始化');
    }

    // 启用 preserveChildren 保留 input 和 cursor 元素
    textRenderer.value = createDomTextRenderer(textDisplayRef.value, {
      preserveChildren: true
    });

    cursorAdapter.value = createDomCursorAdapter({
      textDisplay: textDisplayRef.value,
      textContainer: textContainerRef.value,
      getCurrentPosition: () => sessionRuntime.getSession()?.getState().position ?? 0,
      getCursor: () => cursorRef.value,
      getInput: () => hiddenInputRef.value,
      getSpans: () => textRenderer.value?.getSpans() ?? [],
      setSpans: (spans) => textRenderer.value?.setSpans(spans),
      // 光标配置
      cursorShape: cursorShape.value,
      cursorColor: cursorColor.value,
      cursorBlinkEnabled: cursorBlink.value
    });

    // 读取保存的光标配置
    cursorShape.value = cursorAdapter.value.getCursorShape();
    cursorColor.value = cursorAdapter.value.getCursorColor() || '#ffd700';
    cursorBlink.value = cursorAdapter.value.getCursorBlink();

    inputController.value = createDomInputController({
      getTypingSession: () => sessionRuntime.getSession(),
      onCompositionEnd: () => cursorAdapter.value?.updatePosition()
    });

    // 初始化音频控制器
    audioController.value = createDomAudioController({
      soundPack: {
        // 使用占位符 URL，实际使用时需要替换为真实的音效文件
        keyPress: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTUIGGi78OefTQwMUKfj8LZjGwY5k9j0y3ksBSh+zPLaizsKGGS57OihUBELTKXh8bllHAU2jdXyzn0vBS1+zPDejjsIF2W58Oq'
      },
      enabled: audioEnabled.value,
      volume: audioVolume.value
    });

    // 读取保存的音频配置
    audioEnabled.value = audioController.value.isEnabled();
    audioVolume.value = audioController.value.getVolume();

    // 创建 SessionRuntime（集成音频和录制）
    sessionRuntime = createSessionRuntime({
      enableRecording: true,
      audioController: audioController.value,
      onEvaluate: handleEvaluate,
      onUndo: handleUndo,
      onSnapshot: (snapshot) => {
        if (snapshot) statsPanel.value?.renderSnapshot(snapshot);
      },
      onComplete: (snapshot) => {
        if (snapshot) {
          statsPanel.value?.renderResults(snapshot);
          showResult.value = true;
          // 保存录制数据
          currentRecording.value = sessionRuntime.getLastRecording();
          // 自动保存到历史
          saveRecordingToHistory();
          // 停止幽灵
          ghostManager.value?.stopAll();
        }
      },
      onReset: () => {
        showResult.value = false;
        statsPanel.value?.reset();
      }
    });

    // 初始化统计面板
    statsPanel.value = createDomStatsPanel({
      getLocaleText: (key: string) => key, // 简单实现，直接返回 key
      realtime: {
        cpm: document.getElementById('cpm'),
        totalCpm: document.getElementById('total-cpm'),
        wpm: document.getElementById('wpm'),
        accuracy: document.getElementById('accuracy'),
        time: document.getElementById('time'),
        chars: document.getElementById('char-count')
      },
      result: {
        time: document.getElementById('final-time'),
        cpm: document.getElementById('final-cpm'),
        totalCpm: document.getElementById('final-total-cpm'),
        wpm: document.getElementById('final-wpm'),
        accuracy: document.getElementById('final-accuracy'),
        chars: document.getElementById('final-char-count')
      }
    });

    // 立即附加 input controller（只需附加一次）
    if (hiddenInputRef.value) {
      inputController.value.attachInput(hiddenInputRef.value);
    }

    // 初始化 GhostManager
    ghostManager.value = createGhostManager({
      textDisplay: textDisplayRef.value,
      textContainer: textContainerRef.value,
      getSpans: () => textRenderer.value?.getSpans() ?? []
    });

    // 加载历史录制
    loadSavedRecordings();

    // 应用初始主题
    document.body.classList.add(`theme-${activeTheme.value}`);

    startSession();
  } catch (error) {
    initError.value = error instanceof Error ? error.message : '组件初始化失败';
    isLoading.value = false;
    console.error('初始化失败:', error);
  }
});

onUnmounted(() => {
  // 清理所有资源
  sessionRuntime?.dispose();
  inputController.value?.destroy();
  audioController.value?.destroy();
  player.value?.destroy();
  ghostManager.value?.destroy();
  // 注意：cursorAdapter 目前没有 destroy 方法，但 windowRef 的监听器会在页面卸载时自动清理
});
</script>

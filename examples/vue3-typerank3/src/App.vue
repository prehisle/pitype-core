<template>
  <div class="app">
    <header class="header">
      <h1>TypeFree <span class="version">Vue3</span></h1>
      <div class="controls">
        <div class="selector-container">
          <div class="text-selector">
            <select :value="selectedTextId" @change="handleTextChange">
              <option v-for="textOption in allTexts" :key="textOption.id" :value="textOption.id">
                {{ textOption.label }}
              </option>
            </select>
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
        <button
          class="replay-btn"
          @click="playRecording()"
          :disabled="!hasReplayRecording || isPlayingBack"
          title="回放最近一次练习"
        >
          <i class="fas fa-play-circle" /> 回放
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
              <button @click="playRecording()" :disabled="isPlayingBack">
                <i class="fas fa-play" /> 播放
              </button>
              <button @click="stopPlayback()" :disabled="!isPlayingBack">
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

            <div v-if="availableGhostRecordings.length > 0">
              <label>选择幽灵:</label>
              <div class="ghost-list">
                <div
                  v-for="(recording, index) in availableGhostRecordings"
                  :key="recording.id"
                  class="ghost-item"
                >
                  <label class="ghost-checkbox">
                    <input
                      type="checkbox"
                      :checked="isGhostEnabled(recording.id)"
                      @change="toggleGhost(recording.id)"
                    />
                    <span class="ghost-info">
                      <span class="ghost-name">{{ getGhostName(recording, index) }}</span>
                      <span class="ghost-stats">
                        {{ recording.events.length }} 个事件
                      </span>
                    </span>
                  </label>
                  <input
                    type="color"
                    :value="getGhostColor(recording.id, index)"
                    @input="updateGhostColor(recording.id, ($event.target as HTMLInputElement).value)"
                    class="ghost-color-picker"
                    title="选择光标颜色"
                  />
                </div>
              </div>

              <div v-if="activeGhostIds.length > 0" class="ghost-controls">
                <p>{{ activeGhostIds.length }} 个幽灵已激活</p>
                <label>
                  <input type="checkbox" v-model="showGhostLabels" />
                  显示幽灵名称标签
                </label>
              </div>
            </div>
            <p v-else-if="savedRecordings.length > 0" class="hint">当前文本暂无历史录制，完成一局后即可添加幽灵。</p>
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

    <section class="pitype-text-container" ref="textContainerRef" @click="focusInput">
      <div v-if="initError" class="overlay error-message">
        <i class="fas fa-exclamation-circle" /> {{ initError }}
      </div>
      <div v-else-if="isLoading" class="overlay loading-message">
        <i class="fas fa-spinner fa-spin" /> 加载中...
      </div>
      <div
        ref="textDisplayRef"
        class="pitype-text-display"
        :class="{ hidden: initError || isLoading }"
      >
        <input
          ref="hiddenInputRef"
          id="input-field"
          type="text"
          autocomplete="off"
          class="pitype-input"
        />
        <div ref="cursorRef" class="pitype-cursor cursor" />
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
import { onMounted, onUnmounted, ref, shallowRef, nextTick, computed, watch } from 'vue';
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
  createDomThemeController,
  exportRecordingToFile,
  type CursorShape,
  type RecordingData,
  type Player,
  type GhostManager
} from 'pitype-core';
import { allTexts } from './texts';

const textContainerRef = ref<HTMLElement | null>(null);
const textDisplayRef = ref<HTMLElement | null>(null);
const cursorRef = ref<HTMLElement | null>(null);
const hiddenInputRef = ref<HTMLInputElement | null>(null);

const themes = ['dracula', 'serika', 'botanical', 'aether', 'nord'] as const;
const selectedTextId = ref<number>(0);
const activeTheme = ref<string>('dracula');
const showResult = ref(false);
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
const cursorShape = ref<CursorShape>('outline');
const cursorColor = ref('#6c7cdb');
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
const activeGhostIds = ref<string[]>([]);  // 激活的幽灵 ID
const ghostColors = ref<Record<string, string>>({});   // 以录制 ID 为键的颜色映射
const showGhostLabels = ref(true);       // 是否显示幽灵名称标签

const playbackPosition = ref<number | null>(null);
const shouldStartGhostsOnNextInput = ref(false);
const themeController = shallowRef<ReturnType<typeof createDomThemeController> | null>(null);
let themeControllerCleanup: (() => void) | null = null;

const currentTextSourceId = computed(() => `text-${selectedTextId.value}`);
const availableGhostRecordings = computed(() =>
  savedRecordings.value.filter(
    recording =>
      recording.textSource?.id === currentTextSourceId.value &&
      Array.isArray(recording.events) &&
      recording.events.length > 0
  )
);
const activeGhostRecordings = computed(() =>
  availableGhostRecordings.value.filter(recording => activeGhostIds.value.includes(recording.id))
);
const hasReplayRecording = computed(
  () => !!currentRecording.value && Array.isArray(currentRecording.value.events) && currentRecording.value.events.length > 0
);

const GHOST_COLOR_PALETTE = [
  'rgba(255, 99, 132, 0.8)',   // 粉红
  'rgba(54, 162, 235, 0.8)',   // 蓝色
  'rgba(255, 206, 86, 0.8)',   // 黄色
  'rgba(75, 192, 192, 0.8)',   // 青色
  'rgba(153, 102, 255, 0.8)',  // 紫色
];

const RECORDING_STORAGE_KEY = 'savedRecordings';
const GHOST_COLOR_STORAGE_KEY = 'ghostColors';

let sessionRuntime: ReturnType<typeof createSessionRuntime>;

function cloneRecording(recording: RecordingData): RecordingData {
  return JSON.parse(JSON.stringify(recording)) as RecordingData;
}

function armGhostPlaybackIfNeeded() {
  if (isPlayingBack.value) {
    shouldStartGhostsOnNextInput.value = false;
    return;
  }
  shouldStartGhostsOnNextInput.value = activeGhostRecordings.value.length > 0;
}

function cancelGhostPlayback() {
  shouldStartGhostsOnNextInput.value = false;
  ghostManager.value?.stopAll();
}

function handleEvaluate(event: { index: number; correct: boolean }) {
  textRenderer.value?.applySpanState(event.index, event.correct);
  cursorAdapter.value?.scheduleRefresh();
  if (shouldStartGhostsOnNextInput.value) {
    ghostManager.value?.startAll();
    shouldStartGhostsOnNextInput.value = false;
  }
}

function handleUndo(event: { index: number }) {
  textRenderer.value?.resetSpanState(event.index);
  cursorAdapter.value?.scheduleRefresh();
}

function focusInput() {
  if (isPlayingBack.value) return;
  hiddenInputRef.value?.focus();
}

function restartSession() {
  if (isPlayingBack.value) {
    stopPlayback({ resumeSession: false });
  }
  startSession();
}

function closeResult() {
  showResult.value = false;
  restartSession();
}

async function startSession() {
  try {
    const selectedText = allTexts.find(t => t.id === selectedTextId.value);
    if (!selectedText) {
      throw new Error(`未找到ID为 ${selectedTextId.value} 的文本`);
    }

    playbackPosition.value = null;
    isPlayingBack.value = false;

    const source = createTextSource(selectedText.content, {
      id: `text-${selectedText.id}`,
      locale: selectedText.language
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
    syncGhostSelections();

    // 聚焦输入框
    focusInput();
  } catch (error) {
    initError.value = error instanceof Error ? error.message : '初始化失败';
    isLoading.value = false;
    console.error('启动会话失败:', error);
  }
}

function switchTheme(theme: string) {
  if (themeController.value) {
    activeTheme.value = themeController.value.applyTheme(theme);
  } else {
    activeTheme.value = theme;
  }
}

function handleTextChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  selectedTextId.value = parseInt(target.value, 10);
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
async function playRecording() {
  if (!currentRecording.value || isPlayingBack.value || !currentRecording.value.textSource) return;

  try {
    player.value?.destroy();
    cancelGhostPlayback();

    playbackPosition.value = 0;
    isPlayingBack.value = true;

    // 暂时移除输入监听，避免误触
    inputController.value?.detachInput();

    textRenderer.value?.render(currentRecording.value.textSource);
    await nextTick();
    cursorAdapter.value?.cacheCharSpans();
    cursorAdapter.value?.updatePosition({ immediate: true });

    player.value = createPlayer({
      recording: currentRecording.value,
      playbackSpeed: playbackSpeed.value,
      onEvent: (event) => {
        if (event.type === 'input:evaluate') {
          playbackPosition.value = event.index + 1;
          textRenderer.value?.applySpanState(event.index, event.correct);
        } else if (event.type === 'input:undo') {
          playbackPosition.value = event.index;
          textRenderer.value?.resetSpanState(event.index);
        }
        cursorAdapter.value?.updatePosition({ immediate: false });
      },
      onComplete: () => {
        stopPlayback();
      }
    });

    player.value.play();
  } catch (error) {
    console.error('播放录制失败:', error);
    stopPlayback();
  }
}

function stopPlayback(options: { resumeSession?: boolean } = {}) {
  if (!isPlayingBack.value && playbackPosition.value === null) return;

  const { resumeSession = true } = options;

  player.value?.stop();
  player.value?.destroy();
  player.value = null;

  isPlayingBack.value = false;
  playbackPosition.value = null;

  if (hiddenInputRef.value) {
    inputController.value?.attachInput(hiddenInputRef.value);
  }

  if (resumeSession) {
    startSession();
  } else {
    cursorAdapter.value?.cacheCharSpans();
    cursorAdapter.value?.updatePosition({ immediate: true });
    armGhostPlaybackIfNeeded();
  }
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
function computePaletteIndexFromId(recordingId: string, fallbackIndex?: number): number {
  if (typeof fallbackIndex === 'number') {
    return Math.abs(fallbackIndex) % GHOST_COLOR_PALETTE.length;
  }
  const hash = Array.from(recordingId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return hash % GHOST_COLOR_PALETTE.length;
}

function ensureGhostColor(recordingId: string, fallbackIndex?: number): string {
  if (!ghostColors.value[recordingId]) {
    const paletteIndex = computePaletteIndexFromId(recordingId, fallbackIndex);
    ghostColors.value[recordingId] = GHOST_COLOR_PALETTE[paletteIndex];
    persistGhostColors();
  }
  return ghostColors.value[recordingId];
}

function getGhostName(recording: RecordingData, fallbackIndex = 0): string {
  const name = recording.metadata?.name;
  if (typeof name === 'string') return name;
  const label = recording.metadata?.label;
  if (typeof label === 'string') return label;
  const availableIndex = availableGhostRecordings.value.findIndex(
    (item) => item.id === recording.id
  );
  const resolvedIndex = availableIndex > -1 ? availableIndex : fallbackIndex;
  return `幽灵 #${resolvedIndex + 1}`;
}

function getGhostColor(recordingId: string, fallbackIndex = 0): string {
  return ensureGhostColor(recordingId, fallbackIndex);
}

function updateGhostColor(recordingId: string, color: string) {
  ghostColors.value = {
    ...ghostColors.value,
    [recordingId]: color
  };
  persistGhostColors();
  const activeGhost = ghostManager.value
    ?.getAllGhosts()
    .find(ghost => ghost.config.recording.id === recordingId);
  if (activeGhost) {
    activeGhost.cursorAdapter.setCursorColor(color);
    if (activeGhost.labelElement) {
      activeGhost.labelElement.style.backgroundColor = color;
    }
    activeGhost.config.color = color;
  }
}

function isGhostEnabled(recordingId: string): boolean {
  return activeGhostIds.value.includes(recordingId);
}

function toggleGhost(recordingId: string) {
  if (isGhostEnabled(recordingId)) {
    activeGhostIds.value = activeGhostIds.value.filter(id => id !== recordingId);
  } else {
    activeGhostIds.value = [...activeGhostIds.value, recordingId];
    ensureGhostColor(recordingId);
  }
  syncGhostSelections();
}

function persistGhostColors() {
  try {
    localStorage.setItem(GHOST_COLOR_STORAGE_KEY, JSON.stringify(ghostColors.value));
  } catch (error) {
    console.error('保存幽灵颜色失败:', error);
  }
}

function loadGhostColors() {
  try {
    const colors = localStorage.getItem(GHOST_COLOR_STORAGE_KEY);
    if (colors) {
      const parsed = JSON.parse(colors);
      if (parsed && typeof parsed === 'object') {
        ghostColors.value = parsed;
      }
    }
  } catch (error) {
    console.error('加载幽灵颜色失败:', error);
  }
}

function persistSavedRecordings() {
  try {
    localStorage.setItem(RECORDING_STORAGE_KEY, JSON.stringify(savedRecordings.value));
  } catch (error) {
    console.error('保存录制失败:', error);
  }
}

function pruneGhostSelections(): boolean {
  const availableIds = new Set(availableGhostRecordings.value.map(recording => recording.id));
  const nextActiveIds = activeGhostIds.value.filter(id => availableIds.has(id));
  if (nextActiveIds.length !== activeGhostIds.value.length) {
    activeGhostIds.value = nextActiveIds;
    return true;
  }
  return false;
}

function resetGhostManager() {
  ghostManager.value?.destroy();
  if (!textDisplayRef.value || !textContainerRef.value) {
    ghostManager.value = null;
    return;
  }

  ghostManager.value = createGhostManager({
    textDisplay: textDisplayRef.value,
    textContainer: textContainerRef.value,
    getSpans: () => textRenderer.value?.getSpans() ?? []
  });
}

function syncGhosts() {
  resetGhostManager();
  if (!ghostManager.value) return;

  if (activeGhostRecordings.value.length === 0) {
    shouldStartGhostsOnNextInput.value = false;
    return;
  }

  activeGhostRecordings.value.forEach((recording, index) => {
    ghostManager.value!.addGhost({
      name: getGhostName(recording, index),
      recording,
      color: getGhostColor(recording.id, index),
      shape: 'line',
      showLabel: showGhostLabels.value
    });
  });
  armGhostPlaybackIfNeeded();
}

function syncGhostSelections() {
  if (isPlayingBack.value) return;
  pruneGhostSelections();
  if (!textRenderer.value) return;

  const spans = textRenderer.value.getSpans?.() ?? [];
  if (spans.length === 0) return;

  syncGhosts();
}

watch(showGhostLabels, () => {
  if (activeGhostRecordings.value.length === 0) return;
  syncGhostSelections();
});

watch(availableGhostRecordings, () => {
  const changed = pruneGhostSelections();
  if (changed) {
    syncGhostSelections();
  } else {
    armGhostPlaybackIfNeeded();
  }
}, { deep: true });

function loadSavedRecordings() {
  try {
    const saved = localStorage.getItem(RECORDING_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        savedRecordings.value = parsed.filter(
          (recording: RecordingData) =>
            Array.isArray(recording?.events) && recording.events.length > 0
        );
      }
    }
  } catch (error) {
    console.error('加载录制失败:', error);
  }
  loadGhostColors();
  pruneGhostSelections();
}

function saveRecordingToHistory(recording: RecordingData) {
  if (
    !recording ||
    !recording.textSource?.id ||
    !Array.isArray(recording.events) ||
    recording.events.length === 0
  ) {
    return;
  }

  // 移除相同 ID 的旧录制，保持唯一
  savedRecordings.value = savedRecordings.value.filter(item => item.id !== recording.id);
  savedRecordings.value.push(recording);

  // 针对当前文本最多保留 10 个录制
  const perTextLimit = 10;
  const relatedRecordings = savedRecordings.value
    .filter(item => item.textSource?.id === recording.textSource?.id)
    .sort((a, b) => a.startTime - b.startTime);

  while (relatedRecordings.length > perTextLimit) {
    const oldest = relatedRecordings.shift();
    if (!oldest) continue;
    const removeIndex = savedRecordings.value.findIndex(item => item.id === oldest.id);
    if (removeIndex > -1) {
      savedRecordings.value.splice(removeIndex, 1);
      if (ghostColors.value[oldest.id]) {
        const { [oldest.id]: _, ...rest } = ghostColors.value;
        ghostColors.value = rest;
        persistGhostColors();
      }
    }
  }

  persistSavedRecordings();
  ensureGhostColor(recording.id);
  pruneGhostSelections();
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
      getCurrentPosition: () =>
        playbackPosition.value ?? (sessionRuntime.getSession()?.getState().position ?? 0),
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
    cursorColor.value = cursorAdapter.value.getCursorColor() || '#6c7cdb';
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
          const recording = sessionRuntime.getLastRecording();
          if (recording && Array.isArray(recording.events) && recording.events.length > 0) {
            const snapshotRecording = cloneRecording(recording);
            currentRecording.value = snapshotRecording;
            // 自动保存到历史
            saveRecordingToHistory(snapshotRecording);
          } else {
            currentRecording.value = recording ?? null;
            console.warn('录制数据为空，已跳过保存。');
          }
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

    // 初始化主题控制器
    themeController.value = createDomThemeController({
      themes: Array.from(themes),
      defaultTheme: activeTheme.value,
      selector: '.theme-option',
      target: document.body,
      onThemeChange: (theme) => {
        activeTheme.value = theme;
      }
    });
    themeControllerCleanup = themeController.value.init();
    activeTheme.value = themeController.value.getActiveTheme();

    // 初始化 GhostManager
    resetGhostManager();

    // 加载历史录制
    loadSavedRecordings();

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
  themeControllerCleanup?.();
  // 注意：cursorAdapter 目前没有 destroy 方法，但 windowRef 的监听器会在页面卸载时自动清理
});
</script>

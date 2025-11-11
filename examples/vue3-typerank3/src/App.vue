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
      </div>
    </header>

    <section class="stats">
      <div class="cpm-container">
        <span class="cpm-label">
          <span class="info-text" data-info="cpm">CPM:</span>
        </span>
        <div class="cpm-values">
          <span class="cpm-value">{{ statsSnapshot.correctCpm }}</span>
          <span class="tcpm-value">{{ statsSnapshot.totalCpm }}</span>
          <span class="wpm-value">{{ statsSnapshot.wpm }}</span>
        </div>
      </div>
      <div class="stat-item">
        正确率: <span class="stat-value">{{ statsSnapshot.accuracy }}%</span>
      </div>
      <div class="stat-item">
        时间: <span class="stat-value">{{ formatDuration(statsSnapshot.durationMs) }}</span>
      </div>
      <div class="stat-item">
        字符数: <span class="stat-value">{{ statsSnapshot.totalChars }}</span>
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
          <p><span class="stat-label">总用时:</span> {{ formatDuration(statsSnapshot.durationMs) }}</p>
          <p><span class="stat-label">CPM:</span> {{ statsSnapshot.correctCpm }}</p>
          <p><span class="stat-label">总CPM:</span> {{ statsSnapshot.totalCpm }}</p>
          <p><span class="stat-label">WPM:</span> {{ statsSnapshot.wpm }}</p>
          <p><span class="stat-label">正确率:</span> {{ statsSnapshot.accuracy }}%</p>
          <p><span class="stat-label">总字符数:</span> {{ statsSnapshot.totalChars }}</p>
        </div>
        <button class="modal-button" @click="closeResult">继续练习</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, shallowRef, nextTick } from 'vue';
import {
  createSessionRuntime,
  createTextSource,
  createDomCursorAdapter,
  createDomInputController,
  createDomTextRenderer,
  type StatsSnapshot
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

const statsSnapshot = ref<StatsSnapshot>({
  startedAt: undefined,
  durationMs: 0,
  correctChars: 0,
  totalChars: 0,
  accuracy: 100,
  correctCpm: 0,
  totalCpm: 0,
  wpm: 0,
  completed: false
});

const showResult = ref(false);
const textIndex = ref(0);
const isLoading = ref(true);
const initError = ref<string | null>(null);

const sessionRuntime = createSessionRuntime({
  onEvaluate: handleEvaluate,
  onUndo: handleUndo,
  onSnapshot: (snapshot) => {
    if (snapshot) statsSnapshot.value = snapshot;
  },
  onComplete: (snapshot) => {
    if (snapshot) {
      statsSnapshot.value = snapshot;
      showResult.value = true;
    }
  },
  onReset: () => {
    showResult.value = false;
  }
});

const textRenderer = shallowRef<ReturnType<typeof createDomTextRenderer>>();
const cursorAdapter = shallowRef<ReturnType<typeof createDomCursorAdapter>>();
const inputController = shallowRef<ReturnType<typeof createDomInputController>>();

function handleEvaluate(event: { index: number; correct: boolean }) {
  textRenderer.value?.applySpanState(event.index, event.correct);
  cursorAdapter.value?.scheduleRefresh();
}

function handleUndo(event: { index: number }) {
  textRenderer.value?.resetSpanState(event.index);
  cursorAdapter.value?.scheduleRefresh();
}

function formatDuration(durationMs: number) {
  return `${(durationMs / 1000).toFixed(1)} 秒`;
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

    sessionRuntime.startSession(source);
    textRenderer.value?.render(source);

    // 先显示文本，移除加载状态
    isLoading.value = false;

    // 等待 Vue DOM 更新完成
    await nextTick();

    // 使用三层嵌套的 requestAnimationFrame 确保 DOM 完全更新
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // 首先缓存所有字符元素
          cursorAdapter.value?.cacheCharSpans();

          // 检查是否成功获取到 spans
          const spans = textRenderer.value?.getSpans() ?? [];
          if (spans.length === 0) {
            console.error('未找到任何字符元素，无法定位光标');
            return;
          }

          // 确保光标定位准确
          cursorAdapter.value?.updatePosition({ immediate: true });

          // 设置移动设备支持
          cursorAdapter.value?.enableMobileSupport();

          // 监听尺寸变化，保持光标位置随容器更新
          cursorAdapter.value?.enableResponsiveSync();

          // 聚焦输入框
          focusInput();
        });
      });
    });
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

onMounted(() => {
  try {
    if (!textDisplayRef.value || !textContainerRef.value || !cursorRef.value) {
      throw new Error('DOM 元素未正确初始化');
    }

    textRenderer.value = createDomTextRenderer(textDisplayRef.value, {
      preserveChildren: true,
      textContentClass: 'text-content'
    });
    cursorAdapter.value = createDomCursorAdapter({
      textDisplay: textDisplayRef.value,
      textContainer: textContainerRef.value,
      getCurrentPosition: () => sessionRuntime.getSession()?.getState().position ?? 0,
      getCursor: () => cursorRef.value,
      getInput: () => hiddenInputRef.value,
      getSpans: () => textRenderer.value?.getSpans() ?? [],
      setSpans: (spans) => textRenderer.value?.setSpans(spans)
    });
    inputController.value = createDomInputController({
      getTypingSession: () => sessionRuntime.getSession(),
      onCompositionEnd: () => cursorAdapter.value?.updatePosition()
    });

    if (hiddenInputRef.value) {
      inputController.value.attachInput(hiddenInputRef.value);
    }

    // 应用初始主题
    document.body.classList.add(`theme-${activeTheme.value}`);

    startSession();
  } catch (error) {
    initError.value = error instanceof Error ? error.message : '组件初始化失败';
    isLoading.value = false;
    console.error('初始化失败:', error);
  }
});
</script>

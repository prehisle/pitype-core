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

    <section class="text-container" @click="focusInput">
      <div id="text-display" ref="textDisplayRef" class="text-display">
        <input
          ref="hiddenInputRef"
          id="input-field"
          type="text"
          autocomplete="off"
          @input="onInput"
          @keydown="onKeydown"
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
import { onMounted, ref } from 'vue';
import {
  createSessionRuntime,
  createTextSource,
  createDomCursorAdapter,
  createDomInputController,
  createDomTextRenderer,
  type StatsSnapshot
} from '@pitype/core';
import { texts } from './texts';

const textDisplayRef = ref<HTMLElement | null>(null);
const cursorRef = ref<HTMLElement | null>(null);
const hiddenInputRef = ref<HTMLInputElement | null>(null);

const themes = ['dracula', 'serika', 'botanical', 'aether', 'nord'];
const languages = ['zh-CN', 'zh-TW', 'en-US'];
const activeLanguage = ref('zh-CN');
const activeTheme = ref('dracula');

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

const sessionRuntime = createSessionRuntime({
  onEvaluate: handleEvaluate,
  onUndo: handleUndo,
  onSnapshot: (snapshot) => {
    if (snapshot) statsSnapshot.value = snapshot;
  },
  onComplete: (snapshot) => {
    statsSnapshot.value = snapshot;
    showResult.value = true;
  },
  onReset: () => {
    showResult.value = false;
  }
});

const textRenderer = ref<ReturnType<typeof createDomTextRenderer>>();
const cursorAdapter = ref<ReturnType<typeof createDomCursorAdapter>>();
const inputController = ref<ReturnType<typeof createDomInputController>>();
const currentSource = ref(createTextSource(texts[textIndex.value], { id: 'initial' }));

function handleEvaluate(event: { index: number; correct: boolean }) {
  cursorAdapter.value?.scheduleRefresh();
}

function handleUndo() {
  cursorAdapter.value?.scheduleRefresh();
}

function formatDuration(durationMs: number) {
  return `${(durationMs / 1000).toFixed(1)} 秒`;
}

function focusInput() {
  hiddenInputRef.value?.focus();
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  target.value = '';
  if (!value) return;
  sessionRuntime.getSession()?.input(value);
}

function onKeydown(event: KeyboardEvent) {
  const session = sessionRuntime.getSession();
  if (!session) return;
  if (event.key === 'Backspace') {
    session.undo();
    event.preventDefault();
    return;
  }
  if (event.key === 'Enter') {
    session.input('\n');
    event.preventDefault();
  }
}

function restartSession() {
  textIndex.value = Math.floor(Math.random() * texts.length);
  startSession();
}

function closeResult() {
  showResult.value = false;
  restartSession();
}

function startSession() {
  const source = createTextSource(texts[textIndex.value], {
    id: `text-${textIndex.value}`,
    locale: activeLanguage.value
  });
  currentSource.value = source;
  sessionRuntime.startSession(source);
  textRenderer.value?.render(source);
  cursorAdapter.value?.cacheCharSpans();
  cursorAdapter.value?.updatePosition({ immediate: true });
  cursorAdapter.value?.enableMobileSupport();
  cursorAdapter.value?.enableResponsiveSync();
  focusInput();
}

function switchTheme(theme: string) {
  activeTheme.value = theme;
  document.body.className = '';
  if (theme !== 'dracula') {
    document.body.classList.add(`theme-${theme}`);
  }
}

function switchLanguage(lang: string) {
  activeLanguage.value = lang;
  restartSession();
}

onMounted(() => {
  if (!textDisplayRef.value || !cursorRef.value) return;
  textRenderer.value = createDomTextRenderer(textDisplayRef.value);
  cursorAdapter.value = createDomCursorAdapter({
    textDisplay: textDisplayRef.value,
    textContainer: textDisplayRef.value.parentElement,
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
  startSession();
});
</script>

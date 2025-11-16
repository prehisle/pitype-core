import './app.css';
import App from './App.svelte';
import { texts } from './texts';

declare global {
  interface Window {
    texts?: string[];
  }
}

if (typeof window !== 'undefined') {
  window.texts = texts;
}

const target = document.getElementById('app');

if (!target) {
  throw new Error('根容器 #app 未找到，无法挂载 Svelte 应用');
}

const app = new App({
  target
});

export default app;

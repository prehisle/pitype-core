// 语言资源文件 - 支持中文简体、中文繁体和英文

interface LanguageUI {
  title: string;
  restart: string;
  statsLabels: {
    cpm: string;
    accuracy: string;
    time: string;
    seconds: string;
    charCount: string;
  };
  results: {
    completed: string;
    totalTime: string;
    accuracy: string;
    totalChars: string;
    restart: string;
  };
  info: {
    title: string;
    content: string;
    close: string;
  };
  footer: {
    copyright: string;
  };
  theme: {
    dracula: string;
    serika: string;
    botanical: string;
    aether: string;
    nord: string;
  };
}

interface Language {
  code: string;
  shortCode: string;
  name: string;
  htmlLang: string;
  ui: LanguageUI;
}

const languages: Record<string, Language> = {
  'zh-CN': {
    code: 'zh-CN',
    shortCode: 'CN',
    name: '简体中文',
    htmlLang: 'zh',
    ui: {
      title: '[4202] TypeScript - TypeFree',
      restart: '重新开始',
      statsLabels: {
        cpm: 'CPM:',
        accuracy: '正确率:',
        time: '时间:',
        seconds: '秒',
        charCount: '字符数:'
      },
      results: {
        completed: '练习完成！',
        totalTime: '总用时:',
        accuracy: '正确率:',
        totalChars: '总字符数:',
        restart: '重新开始'
      },
      info: {
        title: 'CPM/WPM 指标说明',
        content:
          'CPM (Characters Per Minute) 是每分钟输入的正确字符数量，只计算正确输入的字符。\n\n\n总CPM是每分钟输入的所有字符数量，包括正确和错误的字符。\n\n\nWPM (Words Per Minute) 是每分钟输入的单词数，计算方法为：WPM = CPM / 5，即每5个字符计为1个单词。\n\n\n因此，当前WPM ≈ CPM / 5，总WPM ≈ 总CPM / 5。\n\n\n中文输入时，每个汉字通常算作1个字符。',
        close: '关闭'
      },
      footer: {
        copyright: '© 2025 TypeFree - 自由无感提升输入效率'
      },
      theme: {
        dracula: 'Dracula 主题',
        serika: 'Serika 主题',
        botanical: 'Botanical 主题',
        aether: 'Aether 主题',
        nord: 'Nord 主题'
      }
    }
  },
  'zh-TW': {
    code: 'zh-TW',
    shortCode: 'TW',
    name: '繁體中文',
    htmlLang: 'zh-TW',
    ui: {
      title: '[4202] TypeScript - TypeFree',
      restart: '重新開始',
      statsLabels: {
        cpm: 'CPM:',
        accuracy: '正確率:',
        time: '時間:',
        seconds: '秒',
        charCount: '字符數:'
      },
      results: {
        completed: '練習完成！',
        totalTime: '總用時:',
        accuracy: '正確率:',
        totalChars: '總字符數:',
        restart: '重新開始'
      },
      info: {
        title: 'CPM/WPM 指標說明',
        content:
          'CPM (Characters Per Minute) 是每分鐘輸入的正確字符數量，只計算正確輸入的字符。\n\n\n總CPM是每分鐘輸入的所有字符數量，包括正確和錯誤的字符。\n\n\nWPM (Words Per Minute) 是每分鐘輸入的單詞數，計算方法為：WPM = CPM / 5，即每5個字符計為1個單詞。\n\n\n因此，當前WPM ≈ CPM / 5，總WPM ≈ 總CPM / 5。\n\n\n中文輸入時，每個漢字通常算作1個字符。',
        close: '關閉'
      },
      footer: {
        copyright: '© 2025 TypeFree - 自由無感提升輸入效率'
      },
      theme: {
        dracula: 'Dracula 主題',
        serika: 'Serika 主題',
        botanical: 'Botanical 主題',
        aether: 'Aether 主題',
        nord: 'Nord 主題'
      }
    }
  },
  'en-US': {
    code: 'en-US',
    shortCode: 'EN',
    name: 'English',
    htmlLang: 'en',
    ui: {
      title: '[4202] TypeScript - TypeFree',
      restart: 'Restart',
      statsLabels: {
        cpm: 'CPM:',
        accuracy: 'Accuracy:',
        time: 'Time:',
        seconds: 'sec',
        charCount: 'Characters:'
      },
      results: {
        completed: 'Practice Complete!',
        totalTime: 'Total Time:',
        accuracy: 'Accuracy:',
        totalChars: 'Total Characters:',
        restart: 'Restart'
      },
      info: {
        title: 'CPM/WPM Metrics Guide',
        content:
          'CPM (Characters Per Minute) is the number of correct characters typed per minute, only counting correctly input characters.\n\n\nTotal CPM is the number of all characters typed per minute, including both correct and incorrect characters.\n\n\nWPM (Words Per Minute) is the number of words typed per minute, calculated as: WPM = CPM / 5, meaning every 5 characters count as 1 word.\n\n\nTherefore, current WPM ≈ CPM / 5, total WPM ≈ total CPM / 5.\n\n\nWhen typing in Chinese, each Chinese character typically counts as 1 character.',
        close: 'Close'
      },
      footer: {
        copyright: '© 2025 TypeFree - Improve Typing Efficiency Effortlessly'
      },
      theme: {
        dracula: 'Dracula Theme',
        serika: 'Serika Theme',
        botanical: 'Botanical Theme',
        aether: 'Aether Theme',
        nord: 'Nord Theme'
      }
    }
  }
};

// 当前语言设置
let currentLanguage = localStorage.getItem('language') || 'zh-CN';

// 初始化语言
export function initLanguage(): void {
  // 应用存储的语言
  applyLanguage(currentLanguage);
  // 更新页面中的所有可翻译文本
  updatePageText();
}

// 应用语言
export function applyLanguage(lang: string): void {
  if (languages[lang]) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    // 更新HTML lang属性
    document.documentElement.lang = languages[lang].htmlLang;
    // 更新页面标题
    document.title = languages[lang].ui.title;
  }
}

// 获取当前语言资源
export function getText(path: string): string {
  const langData = languages[currentLanguage];
  if (!langData) return '';

  // 解析路径，如 'ui.statsLabels.cpm'
  const keys = path.split('.');
  let result: unknown = langData;

  for (const key of keys) {
    if (
      typeof result !== 'object' ||
      result === null ||
      !(key in result) ||
      (result as Record<string, unknown>)[key] === undefined
    ) {
      console.warn(`Missing translation key: ${path}`);
      return path;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return typeof result === 'string' ? result : String(result);
}

// 更新页面上的所有文本
export function updatePageText(): void {
  // 更新标题
  document.title = getText('ui.title');

  // 更新页面中的文本元素
  updateElementsWithDataLang();

  // 更新主题选择器标题属性
  updateThemeTooltips();

  // 更新重启按钮标题
  const restartIcon = document.getElementById('restart-icon');
  if (restartIcon) {
    restartIcon.setAttribute('title', getText('ui.restart'));
  }

  // 更新统计标签
  const accuracyLabel = document.querySelector('.stat-item:nth-child(2)');
  if (accuracyLabel) {
    accuracyLabel.innerHTML = `${getText('ui.statsLabels.accuracy')} <span id="accuracy" class="stat-value">100%</span>`;
  }

  const timeLabel = document.querySelector('.stat-item:nth-child(3)');
  if (timeLabel) {
    timeLabel.innerHTML = `${getText('ui.statsLabels.time')} <span id="time" class="stat-value">0000.0${getText('ui.statsLabels.seconds')}</span>`;
  }

  const charCountLabel = document.querySelector('.stat-item:nth-child(4)');
  if (charCountLabel) {
    charCountLabel.innerHTML = `${getText('ui.statsLabels.charCount')} <span id="char-count" class="stat-value">0</span>`;
  }

  // 更新CPM文本
  const cpmLabel = document.querySelector('.info-text');
  if (cpmLabel) {
    cpmLabel.textContent = getText('ui.statsLabels.cpm');
  }

  // 更新结果弹窗文本
  const resultTitle = document.querySelector('#result-modal h2');
  if (resultTitle) {
    resultTitle.innerHTML = `<i class="fas fa-trophy"></i> ${getText('ui.results.completed')}`;
  }

  const resultLabels = document.querySelectorAll('#result-modal .stat-label');
  if (resultLabels.length >= 6) {
    resultLabels[0].innerHTML = `<i class="fas fa-clock"></i> ${getText('ui.results.totalTime')}`;
    resultLabels[3].innerHTML = `<i class="fas fa-check-circle"></i> ${getText('ui.results.accuracy')}`;
    resultLabels[5].innerHTML = `<i class="fas fa-font"></i> ${getText('ui.results.totalChars')}`;
  }

  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.innerHTML = `<i class="fas fa-redo"></i> ${getText('ui.restart')}`;
  }

  // 更新信息弹窗文本
  const infoTitle = document.getElementById('info-title');
  if (infoTitle) {
    infoTitle.textContent = getText('ui.info.title');
  }

  const infoContent = document.getElementById('info-content');
  if (infoContent) {
    infoContent.textContent = getText('ui.info.content');
  }

  const infoCloseBtn = document.getElementById('info-close-btn');
  if (infoCloseBtn) {
    infoCloseBtn.textContent = getText('ui.info.close');
  }

  // 更新页脚文本
  const footer = document.querySelector('.footer .copyright');
  if (footer) {
    footer.textContent = getText('ui.footer.copyright');
  }
}

// 更新所有具有data-lang属性的元素
function updateElementsWithDataLang(): void {
  const elements = document.querySelectorAll('[data-lang]');
  elements.forEach((element) => {
    const key = element.getAttribute('data-lang');
    if (!key) return;

    // 检查是否是语言选择器按钮
    if (element.classList.contains('language-option') && languages[key]) {
      // 对于语言选择器按钮，使用短代码
      element.textContent = languages[key].shortCode;
    } else {
      // 其他元素使用常规翻译
      element.textContent = getText(key);
    }
  });
}

// 更新主题选择器的工具提示
function updateThemeTooltips(): void {
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach((option) => {
    const theme = option.getAttribute('data-theme');
    if (theme) {
      option.setAttribute('title', getText(`ui.theme.${theme}`));
    }
  });
}

// 页面加载时初始化语言
document.addEventListener('DOMContentLoaded', initLanguage);

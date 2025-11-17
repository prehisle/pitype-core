// 语言资源文件 - 支持中文简体、中文繁体和英文

export interface LanguageUI {
  title: string;
  restart: string;
  statsLabels: {
    cpm: string;
    totalCpm: string;
    wpm: string;
    accuracy: string;
    time: string;
    chars: string;
  };
  result: {
    title: string;
    cpm: string;
    totalCpm: string;
    wpm: string;
    accuracy: string;
    time: string;
    correctChars: string;
    incorrectChars: string;
    totalChars: string;
  };
  info: {
    title: string;
    cpm: string;
    cpmDesc: string;
    totalCpm: string;
    totalCpmDesc: string;
    wpm: string;
    wpmDesc: string;
    accuracy: string;
    accuracyDesc: string;
  };
  theme: {
    dracula: string;
    serika: string;
    botanical: string;
    aether: string;
    nord: string;
  };
}

export interface Language {
  code: string;
  shortCode: string;
  name: string;
  htmlLang: string;
  ui: LanguageUI;
}

export const languages: Record<string, Language> = {
  'zh-CN': {
    code: 'zh-CN',
    shortCode: 'CN',
    name: '简体中文',
    htmlLang: 'zh',
    ui: {
      title: '[4203] React - TypeFree',
      restart: '重新开始',
      statsLabels: {
        cpm: 'CPM',
        totalCpm: '总CPM',
        wpm: 'WPM',
        accuracy: '正确率',
        time: '时间',
        chars: '字符数'
      },
      result: {
        title: '练习完成！',
        cpm: 'CPM',
        totalCpm: '总CPM',
        wpm: 'WPM',
        accuracy: '正确率',
        time: '用时',
        correctChars: '正确字符',
        incorrectChars: '错误字符',
        totalChars: '总字符'
      },
      info: {
        title: 'CPM/WPM 指标说明',
        cpm: 'CPM (正确字符/分钟)',
        cpmDesc: '每分钟输入的正确字符数量，只计算正确输入的字符。',
        totalCpm: '总CPM (总字符/分钟)',
        totalCpmDesc: '每分钟输入的所有字符数量，包括正确和错误的字符。',
        wpm: 'WPM (单词/分钟)',
        wpmDesc: '每分钟输入的单词数，计算方法为：WPM = CPM / 5，即每5个字符计为1个单词。',
        accuracy: '正确率',
        accuracyDesc: '正确字符数 / 总字符数 × 100%'
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
      title: '[4203] React - TypeFree',
      restart: '重新開始',
      statsLabels: {
        cpm: 'CPM',
        totalCpm: '總CPM',
        wpm: 'WPM',
        accuracy: '正確率',
        time: '時間',
        chars: '字符數'
      },
      result: {
        title: '練習完成！',
        cpm: 'CPM',
        totalCpm: '總CPM',
        wpm: 'WPM',
        accuracy: '正確率',
        time: '用時',
        correctChars: '正確字符',
        incorrectChars: '錯誤字符',
        totalChars: '總字符'
      },
      info: {
        title: 'CPM/WPM 指標說明',
        cpm: 'CPM (正確字符/分鐘)',
        cpmDesc: '每分鐘輸入的正確字符數量，只計算正確輸入的字符。',
        totalCpm: '總CPM (總字符/分鐘)',
        totalCpmDesc: '每分鐘輸入的所有字符數量，包括正確和錯誤的字符。',
        wpm: 'WPM (單詞/分鐘)',
        wpmDesc: '每分鐘輸入的單詞數，計算方法為：WPM = CPM / 5，即每5個字符計為1個單詞。',
        accuracy: '正確率',
        accuracyDesc: '正確字符數 / 總字符數 × 100%'
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
      title: '[4203] React - TypeFree',
      restart: 'Restart',
      statsLabels: {
        cpm: 'CPM',
        totalCpm: 'Total CPM',
        wpm: 'WPM',
        accuracy: 'Accuracy',
        time: 'Time',
        chars: 'Characters'
      },
      result: {
        title: 'Practice Complete!',
        cpm: 'CPM',
        totalCpm: 'Total CPM',
        wpm: 'WPM',
        accuracy: 'Accuracy',
        time: 'Time',
        correctChars: 'Correct',
        incorrectChars: 'Incorrect',
        totalChars: 'Total'
      },
      info: {
        title: 'CPM/WPM Metrics Guide',
        cpm: 'CPM (Characters Per Minute)',
        cpmDesc:
          'The number of correct characters typed per minute, only counting correctly input characters.',
        totalCpm: 'Total CPM (Total Characters Per Minute)',
        totalCpmDesc:
          'The number of all characters typed per minute, including both correct and incorrect characters.',
        wpm: 'WPM (Words Per Minute)',
        wpmDesc:
          'The number of words typed per minute, calculated as: WPM = CPM / 5, meaning every 5 characters count as 1 word.',
        accuracy: 'Accuracy',
        accuracyDesc: 'Correct characters / Total characters × 100%'
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

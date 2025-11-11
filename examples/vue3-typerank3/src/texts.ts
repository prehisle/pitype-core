export type Language = 'zh-CN' | 'zh-TW' | 'en-US';

export interface TextOption {
  id: number;
  content: string;
  label: string;
  language: Language;
}

// 所有可用的文本选项
export const allTexts: TextOption[] = [
  // 简体中文
  { id: 0, content: '春风送暖入屠苏，草长莺飞二月天。', label: '简中 - 春风送暖', language: 'zh-CN' },
  { id: 1, content: '千里之行，始于足下。', label: '简中 - 千里之行', language: 'zh-CN' },
  { id: 2, content: '学而时习之，不亦说乎。', label: '简中 - 学而时习', language: 'zh-CN' },
  {
    id: 3,
    content: `打字练习：
这是一个包含换行符的示例文本。
每一行结束后都会有一个换行符。
你可以通过按回车键来输入它们。`,
    label: '简中 - 打字练习（多行）',
    language: 'zh-CN'
  },
  { id: 4, content: '编程是创建一组指令来告诉计算机如何执行任务的过程。', label: '简中 - 编程过程', language: 'zh-CN' },
  { id: 5, content: '熟能生巧，勤能补拙。', label: '简中 - 熟能生巧', language: 'zh-CN' },

  // 繁体中文
  { id: 6, content: '春風送暖入屠蘇，草長鶯飛二月天。', label: '繁中 - 春風送暖', language: 'zh-TW' },
  { id: 7, content: '千里之行，始於足下。', label: '繁中 - 千里之行', language: 'zh-TW' },
  { id: 8, content: '學而時習之，不亦說乎。', label: '繁中 - 學而時習', language: 'zh-TW' },
  {
    id: 9,
    content: `打字練習：
這是一個包含換行符的示例文本。
每一行結束後都會有一個換行符。
你可以通過按回車鍵來輸入它們。`,
    label: '繁中 - 打字練習（多行）',
    language: 'zh-TW'
  },
  { id: 10, content: '編程是創建一組指令來告訴計算機如何執行任務的過程。', label: '繁中 - 編程過程', language: 'zh-TW' },
  { id: 11, content: '熟能生巧，勤能補拙。', label: '繁中 - 熟能生巧', language: 'zh-TW' },

  // 英文
  { id: 12, content: 'The quick brown fox jumps over the lazy dog.', label: 'English - Quick Fox', language: 'en-US' },
  { id: 13, content: 'Programming is the process of creating a set of instructions that tell a computer how to perform a task.', label: 'English - Programming', language: 'en-US' },
  { id: 14, content: 'Practice makes perfect.', label: 'English - Practice', language: 'en-US' },
  { id: 15, content: 'The only way to do great work is to love what you do.', label: 'English - Great Work', language: 'en-US' },
  {
    id: 16,
    content: `Typing practice:
This is a sample text with line breaks.
Each line ends with a newline character.
You can input them by pressing the Enter key.`,
    label: 'English - Typing Practice (Multiline)',
    language: 'en-US'
  },
  { id: 17, content: 'TypeScript is a strongly typed programming language that builds on JavaScript.', label: 'English - TypeScript', language: 'en-US' }
];

// 保留旧的数据结构以保持向后兼容（如果需要）
export const texts: Record<Language, string[]> = {
  'zh-CN': allTexts.filter(t => t.language === 'zh-CN').map(t => t.content),
  'zh-TW': allTexts.filter(t => t.language === 'zh-TW').map(t => t.content),
  'en-US': allTexts.filter(t => t.language === 'en-US').map(t => t.content)
};

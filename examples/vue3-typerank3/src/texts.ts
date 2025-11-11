export type Language = 'zh-CN' | 'zh-TW' | 'en-US';

export const texts: Record<Language, string[]> = {
  'zh-CN': [
    '春风送暖入屠苏，草长莺飞二月天。',
    '千里之行，始于足下。',
    '学而时习之，不亦说乎。',
    `打字练习：
这是一个包含换行符的示例文本。
每一行结束后都会有一个换行符。
你可以通过按回车键来输入它们。`,
    '编程是创建一组指令来告诉计算机如何执行任务的过程。',
    '熟能生巧，勤能补拙。'
  ],
  'zh-TW': [
    '春風送暖入屠蘇，草長鶯飛二月天。',
    '千里之行，始於足下。',
    '學而時習之，不亦說乎。',
    `打字練習：
這是一個包含換行符的示例文本。
每一行結束後都會有一個換行符。
你可以通過按回車鍵來輸入它們。`,
    '編程是創建一組指令來告訴計算機如何執行任務的過程。',
    '熟能生巧，勤能補拙。'
  ],
  'en-US': [
    'The quick brown fox jumps over the lazy dog.',
    'Programming is the process of creating a set of instructions that tell a computer how to perform a task.',
    'Practice makes perfect.',
    'The only way to do great work is to love what you do.',
    `Typing practice:
This is a sample text with line breaks.
Each line ends with a newline character.
You can input them by pressing the Enter key.`,
    'TypeScript is a strongly typed programming language that builds on JavaScript.'
  ]
};

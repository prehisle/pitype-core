import type { ReactElement, ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '[4205] Next.js - TypeFree',
  description: 'pitype-core 提供支持的 TypeRank3 Next.js 示例，完整复刻原生 TS 版本体验。'
};

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="zh">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

'use client';

import { useEffect } from 'react';
import { initTyperank3Demo } from './lib/main';

export default function TypeRank3Page() {
  useEffect(() => {
    initTyperank3Demo();
  }, []);

  return (
    <>
      <div className="container">
        <div className="header">
          <h1>
            TypeFree <span className="version">v0.1.21-next</span>
          </h1>
          <div className="controls">
            <div className="selector-container">
              <div className="language-selector">
                <div className="language-option lang-zh-CN active" data-lang="zh-CN" title="简体中文">
                  CN
                </div>
                <div className="language-option lang-zh-TW" data-lang="zh-TW" title="繁體中文">
                  TW
                </div>
                <div className="language-option lang-en-US" data-lang="en-US" title="English">
                  EN
                </div>
              </div>
              <div className="selector-divider" />
              <div className="theme-selector">
                <div className="theme-option theme-dracula active" data-theme="dracula" title="Dracula 主题" />
                <div className="theme-option theme-serika" data-theme="serika" title="Serika 主题" />
                <div className="theme-option theme-botanical" data-theme="botanical" title="Botanical 主题" />
                <div className="theme-option theme-aether" data-theme="aether" title="Aether 主题" />
                <div className="theme-option theme-nord" data-theme="nord" title="Nord 主题" />
              </div>
              <button id="restart-icon" title="重新开始">
                <i className="fas fa-redo" />
              </button>
            </div>
          </div>
        </div>
        <div className="stats">
          <div className="cpm-container">
            <span className="cpm-label">
              <span className="info-text" data-info="cpm" title="点击查看CPM/WPM指标说明">
                CPM:
              </span>
            </span>
            <div className="cpm-values">
              <span id="cpm" className="cpm-value">
                0
              </span>
              <span id="total-cpm" className="tcpm-value">
                0
              </span>
              <span id="wpm" className="wpm-value">
                0
              </span>
            </div>
          </div>
          <div className="stat-item">
            正确率: <span id="accuracy" className="stat-value">100%</span>
          </div>
          <div className="stat-item">
            时间: <span id="time" className="stat-value">0000.0秒</span>
          </div>
          <div className="stat-item">
            字符数: <span id="char-count" className="stat-value">0</span>
          </div>
        </div>
        <div className="pitype-text-container">
          <div id="text-display" className="pitype-text-display" />
        </div>
        <div className="footer">
          <span className="copyright">© 2025 TypeFree - 自由无感提升输入效率</span>
        </div>
      </div>

      <div id="result-modal" className="modal">
        <div className="modal-content">
          <h2>
            <i className="fas fa-trophy" /> 练习完成！
          </h2>
          <div className="result-stats">
            <p>
              <span className="stat-label">
                <i className="fas fa-clock" /> 总用时:
              </span>{' '}
              <span id="final-time" />
            </p>
            <p>
              <span className="stat-label">
                <i className="fas fa-keyboard" /> CPM:
              </span>{' '}
              <span id="final-cpm" />
            </p>
            <p>
              <span className="stat-label">
                <i className="fas fa-tachometer-alt" /> 总CPM:
              </span>{' '}
              <span id="final-total-cpm" />
            </p>
            <p>
              <span className="stat-label">
                <i className="fas fa-file-word" /> WPM:
              </span>{' '}
              <span id="final-wpm" />
            </p>
            <p>
              <span className="stat-label">
                <i className="fas fa-check-circle" /> 正确率:
              </span>{' '}
              <span id="final-accuracy" />
            </p>
            <p>
              <span className="stat-label">
                <i className="fas fa-font" /> 总字符数:
              </span>{' '}
              <span id="final-char-count" />
            </p>
          </div>
          <button id="restart-btn">
            <i className="fas fa-redo" /> 重新开始
          </button>
        </div>
      </div>

      <div id="info-modal" className="modal">
        <div className="modal-content">
          <h3 id="info-title">指标说明</h3>
          <p id="info-content" />
          <button id="info-close-btn">关闭</button>
        </div>
      </div>
    </>
  );
}

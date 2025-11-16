import { useState, useCallback, useMemo } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Header } from './components/Header';
import { StatsPanel } from './components/StatsPanel';
import { TextDisplay } from './components/TextDisplay';
import { ResultModal } from './components/ResultModal';
import { InfoModal } from './components/InfoModal';
import { Footer } from './components/Footer';
import { textLibrary } from './texts';
import type { StatsSnapshot } from 'pitype-core';

function AppContent() {
  const [snapshot, setSnapshot] = useState<StatsSnapshot | null>(null);
  const [finalSnapshot, setFinalSnapshot] = useState<StatsSnapshot | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  // 随机选择一个文本
  const { text, textId } = useMemo(() => {
    const index = Math.floor(Math.random() * textLibrary.length);
    return {
      text: textLibrary[index],
      textId: `text-${index}`
    };
  }, [sessionKey]);

  const handleComplete = useCallback((snap: StatsSnapshot | null) => {
    setFinalSnapshot(snap);
    setShowResultModal(true);
  }, []);

  const handleSnapshot = useCallback((snap: StatsSnapshot | null) => {
    setSnapshot(snap);
  }, []);

  const handleRestart = useCallback(() => {
    setSnapshot(null);
    setFinalSnapshot(null);
    setShowResultModal(false);
    setShowInfoModal(false);
    setSessionKey((prev) => prev + 1);
  }, []);

  const handleCloseResultModal = useCallback(() => {
    setShowResultModal(false);
  }, []);

  const handleShowInfo = useCallback(() => {
    setShowInfoModal(true);
  }, []);

  const handleCloseInfoModal = useCallback(() => {
    setShowInfoModal(false);
  }, []);

  const isResultModalVisible = useCallback(() => {
    return showResultModal;
  }, [showResultModal]);

  return (
    <div className="app">
      <Header onRestart={handleRestart} />
      <div className="container">
        <StatsPanel snapshot={snapshot} onInfoClick={handleShowInfo} />
        <TextDisplay
          key={sessionKey}
          text={text}
          textId={textId}
          onComplete={handleComplete}
          onSnapshot={handleSnapshot}
          isResultModalVisible={isResultModalVisible}
        />
      </div>
      <Footer />
      <ResultModal
        visible={showResultModal}
        snapshot={finalSnapshot}
        onClose={handleCloseResultModal}
        onRestart={handleRestart}
      />
      <InfoModal visible={showInfoModal} onClose={handleCloseInfoModal} />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;

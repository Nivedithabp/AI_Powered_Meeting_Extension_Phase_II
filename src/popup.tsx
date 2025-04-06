import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Settings, Play, Pause } from 'lucide-react';

function Popup() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [settings, setSettings] = useState({
    enableTranscription: true,
    enableSummary: true,
    enableSentiment: true
  });

  const toggleAnalysis = () => {
    setIsAnalyzing(!isAnalyzing);
    chrome.runtime.sendMessage({
      type: isAnalyzing ? 'STOP_ANALYSIS' : 'START_ANALYSIS'
    });
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">Media Analysis</h1>
        <button
          onClick={toggleAnalysis}
          className={`p-2 rounded-full ${
            isAnalyzing ? 'bg-red-500' : 'bg-green-500'
          } text-white`}
        >
          {isAnalyzing ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </header>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Settings</h2>
          <Settings size={20} />
        </div>

        <div className="space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.enableTranscription}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  enableTranscription: e.target.checked
                })
              }
            />
            <span>Enable Transcription</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.enableSummary}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  enableSummary: e.target.checked
                })
              }
            />
            <span>Enable Summary</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.enableSentiment}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  enableSentiment: e.target.checked
                })
              }
            />
            <span>Enable Sentiment Analysis</span>
          </label>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Popup />);
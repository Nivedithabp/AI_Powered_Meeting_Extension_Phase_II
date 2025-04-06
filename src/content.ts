class MediaAnalyzer {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isAnalyzing: boolean = false;

  async initialize() {
    try {
      // Request desktop capture through Chrome extension API
      const streamId = await new Promise<string>((resolve) => {
        chrome.runtime.sendMessage({ type: 'REQUEST_DESKTOP_CAPTURE' }, (response) => {
          resolve(response.streamId);
        });
      });

      // Get system audio stream using the obtained streamId
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: streamId
          } as MediaTrackConstraints
        },
        video: false
      });

      this.audioContext = new AudioContext({ sampleRate: 44100 });
      this.mediaStream = stream;
      
      // Create audio processing pipeline
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      // Connect nodes
      source.connect(this.analyser);
      this.analyser.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.processor.onaudioprocess = this.handleAudioProcess.bind(this);
      this.isAnalyzing = true;

      console.log('Audio capture initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio capture:', error);
      throw error;
    }
  }

  private handleAudioProcess(event: AudioProcessingEvent) {
    if (!this.isAnalyzing || !this.analyser) return;

    const inputData = event.inputBuffer.getChannelData(0);
    const dataArray = new Float32Array(this.analyser.frequencyBinCount);
    this.analyser.getFloatTimeDomainData(dataArray);
    
    // Calculate RMS value for audio level
    const rms = Math.sqrt(
      inputData.reduce((acc, val) => acc + val * val, 0) / inputData.length
    );
    
    // Send audio data to background script
    chrome.runtime.sendMessage({
      type: 'MEDIA_STREAM',
      data: {
        raw: Array.from(inputData),
        frequency: Array.from(dataArray),
        rms: rms
      }
    });
  }

  startAnalysis() {
    this.isAnalyzing = true;
  }

  stopAnalysis() {
    this.isAnalyzing = false;
  }

  destroy() {
    this.isAnalyzing = false;

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Initialize analyzer when page loads
const analyzer = new MediaAnalyzer();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'START_ANALYSIS') {
    analyzer.initialize().catch(error => {
      console.error('Failed to start analysis:', error);
    });
  } else if (message.type === 'STOP_ANALYSIS') {
    analyzer.destroy();
  } else if (message.type === 'ANALYSIS_RESULT') {
    displayAnalysisResults(message.data);
  }
});

function displayAnalysisResults(data: any) {
  let overlay = document.getElementById('analysis-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'analysis-overlay';
    document.body.appendChild(overlay);
  }

  const audioLevel = data.rms ? Math.min(data.rms * 200, 100) : data.audioLevel || 0;

  overlay.innerHTML = `
    <div class="analysis-content">
      <h3>Analysis Results</h3>
      <div class="transcription">${data.transcription || ''}</div>
      <div class="summary">${data.summary || ''}</div>
      <div class="sentiment">${data.sentiment || ''}</div>
      <div class="audio-level">
        <div class="label">Audio Level</div>
        <div class="meter" style="width: ${audioLevel}%"></div>
      </div>
    </div>
  `;
}
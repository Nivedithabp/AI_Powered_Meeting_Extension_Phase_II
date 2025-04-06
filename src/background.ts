let socket: WebSocket | null = null;
let isConnected = false;

// Initialize WebSocket connection
function initializeWebSocket() {
  if (socket && isConnected) return;

  socket = new WebSocket('ws://localhost:3000');

  socket.onopen = () => {
    isConnected = true;
    console.log('WebSocket connected');
  };

  socket.onclose = () => {
    isConnected = false;
    console.log('WebSocket disconnected');
    // Attempt to reconnect after 5 seconds
    setTimeout(initializeWebSocket, 5000);
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleAnalysisResult(data);
  };
}

function handleAnalysisResult(data: any) {
  // Calculate audio level from frequency data if available
  if (data.frequency) {
    const sum = data.frequency.reduce((acc: number, val: number) => acc + Math.abs(val), 0);
    const average = sum / data.frequency.length;
    data.audioLevel = Math.min(average * 100, 100); // Convert to percentage
  }

  // Send analysis results to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'ANALYSIS_RESULT',
        data: data
      });
    }
  });
}

// Handle desktop capture request
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REQUEST_DESKTOP_CAPTURE') {
    chrome.desktopCapture.chooseDesktopMedia(
      ['audio'],
      sender.tab!,
      (streamId) => {
        sendResponse({ streamId });
      }
    );
    return true; // Required for async response
  }

  if (message.type === 'MEDIA_STREAM') {
    if (socket && isConnected) {
      socket.send(JSON.stringify({
        type: 'AUDIO_DATA',
        data: message.data
      }));
    }
  }
});

// Initialize WebSocket when extension loads
initializeWebSocket();
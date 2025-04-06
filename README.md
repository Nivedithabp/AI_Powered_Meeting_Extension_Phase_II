#  AI-Powered Meeting Assistant

A real-time transcription and meeting analysis tool using WebSockets, system audio input, and AI-based language processing. This project captures audio, transcribes it, and provides summaries, sentiment analysis, and task extraction on the fly.

---

##  Project Structure

```
src/
│
├── server/
│   ├── websocket.js           # Main WebSocket server for real-time updates
│                              # Integrates Google Cloud Speech-to-Text or Whisper
│                              # Text summarization logic (e.g., OpenAI or other models)
│                              # Sentiment analysis logic
│                              # Extracts action items from transcribed text
│                              # Helper functions (e.g., timers, chunking)
│
├── client/
│   ├── popup.html             # Frontend popup interface displaying real-time report
│   ├── popup.js               # WebSocket client that receives updates every 5s/30s
│   └── style.css              # Styling for the popup
|   ___ content.js             # reporting with all details  
│
├── audio/
│   └── system-audio-capture.js  # Captures system audio using ffmpeg or similar
```

---

##  How to Run

### 1. **Install Dependencies**

```bash
npm install
```

Make sure you also have:

- Node.js v18+
- `ffmpeg` installed and added to your system path
- Google Cloud credentials (if using Google Speech-to-Text)

---

### 2. **Start the WebSocket Server**

```bash
node src/server/websocket.js
```

If port 3000 is already in use:

```bash
PORT=3001 node src/server/websocket.js
```

---

### 3. **Open the Client Popup**

Open `client/popup.html` in your browser or use it as part of your browser extension.

Ensure that it connects to the right WebSocket port (edit the port in `popup.js` if changed).

---

### 4. **Testing the System**

- ️ Speak near your system microphone or simulate audio using a WAV/MP3 file via `ffmpeg`.
-  You should see:
  - **Live transcription** every 5 seconds
  - **Summary, sentiment, and task analysis** every 30 seconds
- Check your console for logs or debug prints.

---

## ️ Key Components

| File | Purpose |
|------|---------|
| `websocket.js` | WebSocket server that sends real-time updates to clients |
| `transcriber.js` | Handles transcription (Whisper or Google STT) |
| `summarizer.js` | Summarizes conversation in natural language |
| `sentiment.js` | Detects sentiment from text |
| `taskAnalyzer.js` | Extracts to-do style action items |
| `popup.html/.js` | Displays results in browser window |

---

##  Testing

You can simulate audio input by playing an audio file and piping it using `ffmpeg`. Example:

```bash
ffmpeg -re -i sample_audio.wav -f wav - | node src/server/audio/system-audio-capture.js
```

Or test manually by speaking while the app is running.

To verify each module individually, run:

```bash
node src/server/sentiment.js
node src/server/summarizer.js
node src/server/taskAnalyzer.js
```

Make sure test data is passed to them.

---

##  Notes

- Audio capture works best with `ffmpeg` and loopback audio on macOS.
- Uses WebSockets for real-time push updates.
- You can plug in other NLP services or use open-source models for offline mode.

---

##  Contributing

Feel free to fork, improve, or submit issues! Drop a ⭐ if you like this!

---

##  License

MIT © 2025 Niveditha

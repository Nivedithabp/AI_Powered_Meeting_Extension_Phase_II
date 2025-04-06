import { io } from 'socket.io-client';
import readline from 'readline';

// Connect to your WebSocket server
const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

let isRecording = false;
let targetLanguage = 'fr'; // Default translation language

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function showMenu() {
  console.log('\n🎙️  Available Commands:');
  console.log('s         → Start recording');
  console.log('t         → Stop recording');
  console.log('l [lang]  → Set translation language (e.g., l ja)');
  console.log('q         → Quit\n');
}

socket.on('connect', () => {
  console.log('✅ Connected to server');
  socket.emit('languagePreference', targetLanguage);
  showMenu();
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('processingResults', (results) => {
  console.log('\n🔄 === New Results ===');

  if (results.transcript) {
    console.log('🎤 Transcription:', results.transcript);
  }

  if (results.translation) {
    console.log(`🌍 Translation (${targetLanguage}):`, results.translation);
  }

  if (results.sentiment) {
    console.log('\n📊 Sentiment Analysis:');
    console.log('Label:', results.sentiment.label);
    console.log('Score:', results.sentiment.score);
  }

  if (results.summary) {
    console.log('\n📝 Summary:\n', results.summary);
  }

  if (results.tasks?.length) {
    console.log('\n✅ Extracted Tasks / Events:');
    results.tasks.forEach((task, i) => {
      if (task.trim()) console.log(`- ${task.trim()}`);
    });
  }

  console.log('======================\n');
});

socket.on('error', (error) => {
  console.error('🚨 Error from server:', error.message);
});

// Handle terminal input
rl.on('line', (input) => {
  const trimmed = input.trim().toLowerCase();

  if (trimmed === 's') {
    if (!isRecording) {
      console.log('▶️  Starting recording...');
      socket.emit('startRecording');
      isRecording = true;
    } else {
      console.log('⚠️  Already recording');
    }
  } else if (trimmed === 't') {
    if (isRecording) {
      console.log('⏹️  Stopping recording...');
      socket.emit('stopRecording');
      isRecording = false;
    } else {
      console.log('⚠️  Not currently recording');
    }
  } else if (trimmed.startsWith('l ')) {
    const langCode = trimmed.split(' ')[1];
    if (langCode && langCode.length === 2) {
      targetLanguage = langCode;
      socket.emit('languagePreference', targetLanguage);
      console.log(`🌍 Translation language set to: ${targetLanguage}`);
    } else {
      console.log('⚠️  Invalid language code. Example: `l fr`');
    }
  } else if (trimmed === 'q') {
    console.log('👋 Exiting...');
    if (isRecording) socket.emit('stopRecording');
    socket.disconnect();
    rl.close();
    process.exit(0);
  } else {
    showMenu();
  }
});

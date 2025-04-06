
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SpeechClient } from '@google-cloud/speech';
import recorder from 'node-record-lpcm16';
import { pipeline } from '@xenova/transformers';
import dotenv from 'dotenv';
import { v2 as Translate } from '@google-cloud/translate';

const translator = new Translate.Translate();
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const speechClient = new SpeechClient();
let sentimentPipeline, summarizationPipeline, taskPipeline;

async function loadModels() {
  sentimentPipeline = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
  summarizationPipeline = await pipeline('summarization', 'Xenova/distilbart-cnn-12-6');
  taskPipeline = await pipeline('text2text-generation', 'Xenova/flan-t5-base');
  console.log('All models loaded successfully');
}

function startGoogleStream(onTranscript, onError) {
  const request = {
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    },
    interimResults: false
  };

  const recognizeStream = speechClient
    .streamingRecognize(request)
    .on('error', onError)
    .on('data', (data) => {
      const transcript = data.results[0]?.alternatives[0]?.transcript;
      const isFinal = data.results[0]?.isFinal;
      if (transcript && isFinal) onTranscript(transcript);
    });

  const recording = recorder
    .record({
      sampleRateHertz: 16000,
      threshold: 0,
      silence: '10.0',
      recordProgram: 'rec',
      device: 'BlackHole 16ch' // Set up via Audio MIDI Setup
    })
    .stream()
    .on('error', onError)
    .pipe(recognizeStream);

  return {
    stop: () => {
      recorder.stop();
      recognizeStream.end();
    }
  };
}

// Translates from English to the given target language
async function translateText(text, targetLang = 'es') {
    try {
      const [translation] = await translator.translate(text, targetLang);
      return translation;
    } catch (error) {
      console.error('Translation error:', error.message);
      return text + ' (Translation failed)';
    }
  }
  

httpServer.listen(3001, () => {
  console.log('Server running on port 3001');
  loadModels();
});

io.on('connection', (socket) => {
  let googleStream = null;
  let lastTranslation = 0;
  let lastAnalysis = 0;
  let targetLanguage = 'es';

  socket.on('languagePreference', (lang) => {
    targetLanguage = lang;
  });

  socket.on('startRecording', () => {
    if (googleStream) return;

    googleStream = startGoogleStream(async (transcript) => {
      const now = Date.now();

      if (now - lastTranslation >= 5000) {
        const translation = await translateText(transcript, targetLanguage);
        socket.emit('processingResults', { transcript, translation });
        lastTranslation = now;
      }

      if (now - lastAnalysis >= 30000) {
        const [sentiment, summary, tasks] = await Promise.all([
          sentimentPipeline(transcript),
          summarizationPipeline(transcript),
          taskPipeline(`Extract important tasks from: ${transcript}`)
        ]);

        socket.emit('processingResults', {
          sentiment: sentiment[0],
          summary: summary[0].summary_text,
          tasks: tasks[0].generated_text.split('\n')
        });
        lastAnalysis = now;
      }
    }, (error) => {
      socket.emit('error', { message: 'Transcription error', error: error.message });
    });
  });

  socket.on('stopRecording', () => {
    if (googleStream) {
      googleStream.stop();
      googleStream = null;
    }
  });

  socket.on('disconnect', () => {
    if (googleStream) {
      googleStream.stop();
      googleStream = null;
    }
  });
});

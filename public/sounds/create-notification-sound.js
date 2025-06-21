// Script para criar arquivo de som de notificação
// Execute no Node.js para gerar o arquivo de som

const fs = require('fs');

// Função para criar um arquivo WAV simples
function createNotificationWav() {
  const sampleRate = 44100;
  const duration = 0.5; // 500ms
  const frequency1 = 800; // 800Hz
  const frequency2 = 1000; // 1000Hz
  
  const samples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + samples * 2); // WAV header + 16-bit samples
  
  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples * 2, 40);
  
  // Generate samples
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    
    // Primeiro tom (primeiros 250ms)
    if (t < 0.25) {
      sample = Math.sin(2 * Math.PI * frequency1 * t) * 0.3;
    }
    // Segundo tom (últimos 250ms)
    else {
      sample = Math.sin(2 * Math.PI * frequency2 * t) * 0.3;
    }
    
    // Envelope para evitar clicks
    const envelope = Math.sin(Math.PI * t / duration);
    sample *= envelope;
    
    const intSample = Math.round(sample * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }
  
  return buffer;
}

// Gerar arquivo de notificação
const notificationWav = createNotificationWav();
fs.writeFileSync('notification.wav', notificationWav);
console.log('✅ Arquivo notification.wav criado!'); 
import { useCallback, useRef, useState } from 'react';

// Função para criar som usando Web Audio API
const createNotificationSound = (audioContext: AudioContext, frequency: number = 800, duration: number = 200) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
  
  return { oscillator, gainNode };
};

export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('notifications_sound_enabled');
    return stored ? JSON.parse(stored) : true;
  });
  
  const [volume, setVolume] = useState(() => {
    const stored = localStorage.getItem('notifications_volume');
    return stored ? parseFloat(stored) : 0.7;
  });
  
  const [soundType, setSoundType] = useState<'beep' | 'notification' | 'whatsapp'>(() => {
    const stored = localStorage.getItem('notifications_sound_type');
    return (stored as 'beep' | 'notification' | 'whatsapp') || 'beep';
  });

  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('🔊 Audio Context iniciado');
      } catch (error) {
        console.error('❌ Erro ao iniciar Audio Context:', error);
      }
    }
  }, []);

  const playBeepSound = useCallback(async () => {
    try {
      initializeAudioContext();
      
      if (!audioContextRef.current) {
        throw new Error('Audio Context não disponível');
      }

      // Resume context se estiver suspenso (necessário para mobile)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Criar som de notificação (duplo beep como WhatsApp)
      const { oscillator: osc1, gainNode: gain1 } = createNotificationSound(audioContextRef.current, 800, 150);
      
      // Aplicar volume
      gain1.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gain1.gain.linearRampToValueAtTime(volume * 0.3, audioContextRef.current.currentTime + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.15);
      
      osc1.start(audioContextRef.current.currentTime);
      osc1.stop(audioContextRef.current.currentTime + 0.15);
      
      // Segundo beep após 200ms
      setTimeout(() => {
        if (audioContextRef.current) {
          const { oscillator: osc2, gainNode: gain2 } = createNotificationSound(audioContextRef.current, 1000, 150);
          
          gain2.gain.setValueAtTime(0, audioContextRef.current.currentTime);
          gain2.gain.linearRampToValueAtTime(volume * 0.3, audioContextRef.current.currentTime + 0.01);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.15);
          
          osc2.start(audioContextRef.current.currentTime);
          osc2.stop(audioContextRef.current.currentTime + 0.15);
        }
      }, 200);
      
      console.log('🔊 Som beep tocado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao tocar beep:', error);
    }
  }, [initializeAudioContext, volume]);

  const playNotificationSound = useCallback(async () => {
    if (!isSoundEnabled) {
      console.log('🔇 Som desabilitado');
      return;
    }

    try {
      console.log('🔊 Tocando som de notificação:', soundType);
      
      switch (soundType) {
        case 'beep':
          await playBeepSound();
          break;
        case 'notification':
          // Som simples gerado por oscillator
          await playBeepSound();
          break;
        case 'whatsapp':
          // Som duplo como WhatsApp
          await playBeepSound();
          break;
        default:
          await playBeepSound();
      }
    } catch (error) {
      console.error('❌ Erro ao tocar notificação:', error);
      // Fallback sempre para beep
      await playBeepSound();
    }
  }, [isSoundEnabled, soundType, playBeepSound]);

  const toggleSound = useCallback((enabled: boolean) => {
    setIsSoundEnabled(enabled);
    localStorage.setItem('notifications_sound_enabled', JSON.stringify(enabled));
    console.log('🔊 Som de notificação:', enabled ? 'ativado' : 'desativado');
  }, []);

  const setNotificationVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    localStorage.setItem('notifications_volume', clampedVolume.toString());
    console.log('🔊 Volume definido:', Math.round(clampedVolume * 100) + '%');
  }, []);

  const setSoundTypeCallback = useCallback((type: 'beep' | 'notification' | 'whatsapp') => {
    setSoundType(type);
    localStorage.setItem('notifications_sound_type', type);
    console.log('🔊 Tipo de som alterado para:', type);
  }, []);

  return {
    isSoundEnabled,
    volume,
    soundType,
    playNotificationSound,
    toggleSound,
    setVolume: setNotificationVolume,
    setSoundType: setSoundTypeCallback
  };
}; 
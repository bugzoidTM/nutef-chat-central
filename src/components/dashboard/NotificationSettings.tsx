import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, VolumeX, Settings, Play } from 'lucide-react';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const NotificationSettings = () => {
  const { 
    isSoundEnabled, 
    volume, 
    soundType, 
    toggleSound, 
    setVolume, 
    setSoundType,
    playNotificationSound 
  } = useNotificationSound();

  const handleTestSound = async () => {
    console.log('🔊 Testando som de notificação...');
    await playNotificationSound();
  };

  const getSoundLabel = (type: string) => {
    switch (type) {
      case 'beep':
        return '🔔 Beep Clássico';
      case 'notification':
        return '📢 Notificação';
      case 'whatsapp':
        return '💬 WhatsApp';
      default:
        return type;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">🔊 Notificações Sonoras</h4>
            <Switch
              checked={isSoundEnabled}
              onCheckedChange={toggleSound}
            />
          </div>
          
          {isSoundEnabled && (
            <>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">🎵 Tipo de Som</label>
                  <Select value={soundType} onValueChange={setSoundType}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione o som" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beep">🔔 Beep Clássico (Sempre funciona)</SelectItem>
                      <SelectItem value="notification">📢 Notificação</SelectItem>
                      <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {soundType === 'beep' 
                      ? 'Som gerado pelo navegador, funciona sempre'
                      : 'Som de arquivo - se não funcionar, use o Beep Clássico'
                    }
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">🔊 Volume</label>
                  <Slider
                    value={[volume]}
                    onValueChange={(value) => setVolume(value[0])}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>🔇 Silencioso</span>
                    <span className="font-medium">{Math.round(volume * 100)}%</span>
                    <span>🔊 Alto</span>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleTestSound}
                variant="outline"
                size="sm"
                className="w-full flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Testar Som {getSoundLabel(soundType)}
              </Button>
            </>
          )}
          
          <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
            {isSoundEnabled 
              ? `✅ Você receberá notificações sonoras (${getSoundLabel(soundType)}) para novas mensagens`
              : '🔇 Notificações sonoras desativadas'}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationSettings; 
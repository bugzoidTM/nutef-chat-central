import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Settings, Database, Zap } from 'lucide-react';
import { useMessagesConfig } from '@/hooks/useMessagesConfig';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const MessageSourceSelector = () => {
  const {
    config,
    setSource,
    setInstanceName,
    setInstancePhone,
    isEvolutionMode,
    isSupabaseMode,
  } = useMessagesConfig();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Configurar Fonte de Mensagens
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração da Fonte de Mensagens
          </DialogTitle>
          <DialogDescription>
            Escolha como buscar as mensagens: do banco de dados (Supabase) ou diretamente da Evolution API.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <RadioGroup
            value={config.source}
            onValueChange={(value) => setSource(value as 'supabase' | 'evolution')}
            className="space-y-4"
          >
            <Card className={`cursor-pointer transition-all ${isSupabaseMode ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="supabase" id="supabase" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="supabase" className="cursor-pointer">
                      <div className="flex items-center gap-2 font-medium">
                        <Database className="h-4 w-4 text-blue-500" />
                        Supabase (Banco de Dados)
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Busca mensagens armazenadas no banco de dados via webhooks.
                        Mais rápido, mas depende do webhook estar funcionando.
                      </p>
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-all ${isEvolutionMode ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="evolution" id="evolution" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="evolution" className="cursor-pointer">
                      <div className="flex items-center gap-2 font-medium">
                        <Zap className="h-4 w-4 text-green-500" />
                        Evolution API (Direto)
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Busca mensagens diretamente da Evolution API em tempo real.
                        Mais lento, mas sempre atualizado.
                      </p>
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </RadioGroup>

          {isEvolutionMode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Configurações da Evolution API</CardTitle>
                <CardDescription className="text-xs">
                  Configure os dados da instância Evolution para buscar mensagens.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instanceName">Nome da Instância</Label>
                  <Input
                    id="instanceName"
                    placeholder="default"
                    value={config.instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nome da instância configurada na Evolution API
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instancePhone">Telefone da Instância</Label>
                  <Input
                    id="instancePhone"
                    placeholder="5511999999999"
                    value={config.instancePhone}
                    onChange={(e) => setInstancePhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Número do WhatsApp conectado à instância (apenas números)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-2 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Status Atual:</p>
            <div className="flex items-center gap-2">
              {isSupabaseMode ? (
                <Database className="h-4 w-4 text-blue-500" />
              ) : (
                <Zap className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm">
                {isSupabaseMode 
                  ? 'Buscando mensagens do banco de dados'
                  : `Buscando mensagens da Evolution API (${config.instanceName})`
                }
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 
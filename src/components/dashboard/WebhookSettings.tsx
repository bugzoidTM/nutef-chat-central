
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useWebhookConfig } from '@/hooks/useWebhookConfig';
import { Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WebhookSettings = () => {
  const { toast } = useToast();
  const { webhookConfigs, saveWebhookConfig, toggleWebhook, isSaving, isToggling } = useWebhookConfig();
  
  const [instanceName, setInstanceName] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  // Generate webhook URL for the instance
  const generateWebhookUrl = (instance: string) => {
    return `https://watende.nutef.com/webhook/whatsai`;
  };

  const handleSaveWebhook = () => {
    if (!instanceName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Nome da instância é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const webhookUrl = generateWebhookUrl(instanceName);
    saveWebhookConfig({
      instanceName: instanceName.trim(),
      webhookUrl,
      webhookSecret: webhookSecret.trim() || undefined,
    });

    setInstanceName('');
    setWebhookSecret('');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Webhooks</CardTitle>
          <CardDescription>
            Configure webhooks para receber mensagens automaticamente da Evolution API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instanceName">Nome da Instância</Label>
              <Input
                id="instanceName"
                placeholder="Ex: default"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhookSecret">Secret (Opcional)</Label>
              <Input
                id="webhookSecret"
                type="password"
                placeholder="Chave secreta para validação"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleSaveWebhook} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Configurar Webhook'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhooks Configurados</CardTitle>
          <CardDescription>
            Lista de webhooks ativos para recebimento de mensagens
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhookConfigs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhum webhook configurado
            </p>
          ) : (
            <div className="space-y-4">
              {webhookConfigs.map((config) => (
                <div key={config.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{config.instance_name}</h3>
                      <p className="text-sm text-gray-500">
                        Criado em {new Date(config.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={config.is_active ? "default" : "secondary"}>
                        {config.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Switch
                        checked={config.is_active}
                        onCheckedChange={(checked) => 
                          toggleWebhook({ id: config.id, isActive: checked })
                        }
                        disabled={isToggling}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm font-mono text-gray-700 truncate">
                        {config.webhook_url}
                      </span>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(config.webhook_url, 'URL do webhook')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(config.webhook_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {config.webhook_secret && (
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-700">
                          Secret: ••••••••
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(config.webhook_secret!, 'Webhook secret')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instruções de Configuração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>1.</strong> Configure o webhook na Evolution API usando a URL gerada acima</p>
            <p><strong>2.</strong> Use o método POST para o endpoint:</p>
            <code className="block bg-gray-100 p-2 rounded text-xs">
              POST /webhook/set/{'{'}instanceName{'}'}
            </code>
            <p><strong>3.</strong> As mensagens recebidas aparecerão automaticamente no dashboard</p>
            <p><strong>4.</strong> Novas conversas serão criadas automaticamente com setor "Suporte"</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookSettings;

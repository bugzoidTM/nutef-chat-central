
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, User, Mail, Phone } from 'lucide-react';

const InitialSetup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  console.log('InitialSetup - Rendered for user:', user?.id);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    console.log('InitialSetup - Starting setup with data:', { name, email, phone });

    setLoading(true);

    try {
      // Gerar instance_name baseado no telefone (apenas números)
      const instanceName = phone.replace(/\D/g, '');
      
      console.log('InitialSetup - Generated instance name:', instanceName);

      // Atualizar o perfil do usuário com os dados coletados
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name,
          phone,
          setup_completed: true,
          instance_name: instanceName,
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('InitialSetup - Update error:', updateError);
        throw updateError;
      }

      console.log('InitialSetup - Profile updated successfully');

      toast({
        title: "Configuração inicial concluída",
        description: "Agora vamos configurar sua instância WhatsApp.",
      });

      // Forçar recarregamento do perfil
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('InitialSetup - Error:', error);
      toast({
        title: "Erro na configuração",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Smartphone className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Configuração Inicial</CardTitle>
          <CardDescription>
            Complete seus dados para configurar o WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <Label htmlFor="name" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Nome completo</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>E-mail</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone" className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Telefone (WhatsApp)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                Este número será usado para criar sua instância WhatsApp
              </p>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Configurando...' : 'Continuar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InitialSetup;

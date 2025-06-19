
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/Logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, cleanupAuthState } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('AuthPage - Starting sign in for:', email);
      
      const { error } = await signIn(email, password);

      if (error) {
        console.error('AuthPage - Sign in error:', error);
        toast({
          title: "Erro no login",
          description: error.message || "Erro ao fazer login",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado",
          description: "Redirecionando...",
        });
      }
    } catch (error: any) {
      console.error('AuthPage - Unexpected sign in error:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado no login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('AuthPage - Starting sign up for:', email);
      
      const { error } = await signUp(email, password, {
        name: '', // Será preenchido na tela de configuração inicial
        role: 'admin', // Admin sempre
      });

      if (error) {
        console.error('AuthPage - Sign up error:', error);
        
        let errorMessage = error.message || "Erro ao criar conta";
        
        // Mensagens de erro mais amigáveis
        if (error.message?.includes('User already registered')) {
          errorMessage = "Este email já está cadastrado. Tente fazer login.";
        } else if (error.message?.includes('Invalid email')) {
          errorMessage = "Email inválido. Verifique o formato do email.";
        } else if (error.message?.includes('Password')) {
          errorMessage = "Senha deve ter pelo menos 6 caracteres.";
        }
        
        toast({
          title: "Erro no cadastro",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cadastro realizado",
          description: "Verifique seu email para confirmar o cadastro ou continue se já foi confirmado.",
        });
        
        // Limpar campos após sucesso
        setEmail('');
        setPassword('');
      }
    } catch (error: any) {
      console.error('AuthPage - Unexpected sign up error:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado no cadastro.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAuth = () => {
    console.log('AuthPage - Clearing auth state manually');
    cleanupAuthState();
    toast({
      title: "Estado limpo",
      description: "Estado de autenticação foi limpo. Tente novamente.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo className="h-16" />
          </div>
          <CardTitle className="text-2xl">WhatsApp Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar Admin</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Carregando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="signup-email">Email do Administrador</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Conta de Administrador'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAuth}
              className="text-xs"
            >
              Limpar Estado de Autenticação
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;

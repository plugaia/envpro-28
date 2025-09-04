import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Mail, MessageSquare, FileText, CheckCircle, ArrowRight } from 'lucide-react';
const Landing = () => {
  return <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/lovable-uploads/301c97ce-b36d-4b78-9785-16511b858982.png" alt="EnvPRO" className="h-8 w-auto" />
            
          </div>
          <Link to="/auth">
            <Button variant="outline">Entrar</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Plataforma de <span className="text-primary">Propostas Jurídicas</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Gerencie e envie suas propostas jurídicas de forma profissional via email e WhatsApp
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="hero-gradient text-primary-foreground">
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Saiba Mais
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="card-elegant">
            <CardHeader className="text-center">
              <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Envio por Email</CardTitle>
              <CardDescription>
                Envie propostas profissionais diretamente por email com links personalizados
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-elegant">
            <CardHeader className="text-center">
              <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Integração WhatsApp</CardTitle>
              <CardDescription>
                Compartilhe propostas via WhatsApp de forma rápida e direta com seus clientes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-elegant">
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Gestão Completa</CardTitle>
              <CardDescription>
                Gerencie clientes, propostas e acompanhe o status de cada negociação
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Benefits */}
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-foreground mb-8">
            Por que escolher o EnvPRO?
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-card">
              <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
              <span className="text-card-foreground">Interface intuitiva</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-card">
              <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
              <span className="text-card-foreground">Envios automáticos</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-card">
              <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
              <span className="text-card-foreground">Relatórios detalhados</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-card">
              <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
              <span className="text-card-foreground">Suporte completo</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Card className="card-elegant max-w-2xl mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Comece hoje mesmo</CardTitle>
            <CardDescription>
              Crie sua conta gratuitamente e transforme a forma como você envia propostas jurídicas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/auth">
              <Button size="lg" className="w-full md:w-auto">
                Criar Conta Gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 EnvPRO. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>;
};
export default Landing;
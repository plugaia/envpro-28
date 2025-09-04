import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Palette, Save, Moon, Sun, Monitor } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function ThemeSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Load theme from localStorage
    const saved = localStorage.getItem('theme');
    if (saved) {
      setTheme(saved);
    }
  }, []);

  const handleSaveTheme = async () => {
    try {
      setLoading(true);
      
      // Save to localStorage
      localStorage.setItem('theme', theme);
      
      // Apply theme
      document.documentElement.classList.remove('light', 'dark');
      if (theme !== 'system') {
        document.documentElement.classList.add(theme);
      } else {
        // Apply system theme
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.add(systemDark ? 'dark' : 'light');
      }
      
      toast({
        title: "Tema atualizado",
        description: "Suas preferências de tema foram salvas.",
      });
    } catch (error) {
      console.error('Error saving theme:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as preferências de tema.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const themeOptions = [
    {
      value: "light",
      label: "Claro",
      description: "Tema claro para melhor visibilidade durante o dia",
      icon: Sun
    },
    {
      value: "dark",
      label: "Escuro",
      description: "Tema escuro para reduzir fadiga ocular",
      icon: Moon
    },
    {
      value: "system",
      label: "Sistema",
      description: "Segue as configurações do seu sistema operacional",
      icon: Monitor
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Configurações de Tema
        </CardTitle>
        <CardDescription>
          Personalize a aparência da interface
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Escolha o tema da interface</Label>
          <RadioGroup
            value={theme}
            onValueChange={setTheme}
            className="space-y-4"
          >
            {themeOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value={option.value} id={option.value} />
                <div className="flex items-center gap-3 flex-1">
                  <option.icon className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-1">
                    <Label htmlFor={option.value} className="font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Button 
          onClick={handleSaveTheme} 
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Tema"}
        </Button>
      </CardContent>
    </Card>
  );
}
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LayoutTemplate } from "lucide-react";

const Templates = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <LayoutTemplate className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Templates de Propostas</CardTitle>
              <CardDescription>
                Crie e gerencie seus templates para agilizar a criação de propostas.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <LayoutTemplate className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Funcionalidade em Breve</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Aqui você poderá criar, editar e gerenciar seus templates de propostas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Templates;
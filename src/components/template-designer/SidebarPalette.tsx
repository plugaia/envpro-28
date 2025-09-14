"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Heading1, Heading2, Heading3, Type, Minus, Link as LinkIcon, Variable, Package } from "lucide-react";
import { SYSTEM_VARIABLES, newId, LayoutBlock } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type TemplateField } from "@/pages/Templates";

interface SidebarPaletteProps {
  fields: TemplateField[];
  onAdd: (block: LayoutBlock) => void;
}

export default function SidebarPalette({ fields, onAdd }: SidebarPaletteProps) {
  return (
    <Card className="h-full shadow-none border-none">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-5 w-5" />
          Elementos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Texto</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onAdd({ id: newId(), type: "header", content: "Título", level: 1, className: "text-2xl font-bold text-center" })}>
              <Heading1 className="h-4 w-4 mr-2" /> Título
            </Button>
            <Button variant="outline" size="sm" onClick={() => onAdd({ id: newId(), type: "header", content: "Subtítulo", level: 2, className: "text-xl font-semibold" })}>
              <Heading2 className="h-4 w-4 mr-2" /> Subtítulo
            </Button>
            <Button variant="outline" size="sm" onClick={() => onAdd({ id: newId(), type: "text", content: "Escreva seu texto aqui...", className: "text-base leading-relaxed" })}>
              <Type className="h-4 w-4 mr-2" /> Texto
            </Button>
            <Button variant="outline" size="sm" onClick={() => onAdd({ id: newId(), type: "divider", className: "my-4" })}>
              <Minus className="h-4 w-4 mr-2" /> Divisor
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Mídia</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onAdd({ id: newId(), type: "image", src: "", alt: "Imagem", width: 300, align: "center", className: "my-4" })}>
              <ImageIcon className="h-4 w-4 mr-2" /> Imagem
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Variable className="h-4 w-4" /> Variáveis do Sistema
          </h4>
          <ScrollArea className="h-36 rounded border">
            <div className="p-2 space-y-2">
              {SYSTEM_VARIABLES.map((v) => (
                <Button
                  key={v.key}
                  variant="ghost"
                  className="w-full justify-start text-left"
                  onClick={() => onAdd({ id: newId(), type: "system-variable", variable: v.key, label: v.label, className: "font-medium" })}
                >
                  <Badge variant="secondary" className="mr-2">{v.key}</Badge>
                  {v.label}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <LinkIcon className="h-4 w-4" /> Campos Personalizados
          </h4>
          <ScrollArea className="h-48 rounded border">
            <div className="p-2 space-y-2">
              {fields.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1">Nenhum campo definido neste modelo.</p>
              ) : (
                fields.map((f) => (
                  <Button
                    key={f.field_name + f.order}
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() =>
                      onAdd({
                        id: newId(),
                        type: "dynamic-field",
                        field_name: f.field_name,
                        label: f.field_label,
                        className: "font-medium"
                      })
                    }
                  >
                    <Badge variant="secondary" className="mr-2">{f.field_type}</Badge>
                    {f.field_label}
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GripVertical, Trash2, Pencil, Save as SaveIcon, X, Image as ImageIcon, Variable, Type, Minus } from "lucide-react";
import { LayoutBlock } from "./types";

interface CanvasBlockProps {
  block: LayoutBlock;
  onChange: (block: LayoutBlock) => void;
  onDelete: () => void;
}

export default function CanvasBlock({ block, onChange, onDelete }: CanvasBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const [editing, setEditing] = useState(false);

  const renderPreview = () => {
    switch (block.type) {
      case "header": {
        const b = block as any;
        const cls = b.className || (b.level === 1 ? "text-2xl font-bold" : b.level === 2 ? "text-xl font-semibold" : "text-lg font-semibold");
        return <div className={cls}>{b.content}</div>;
      }
      case "text": {
        const b = block as any;
        return <p className={b.className || "text-base leading-relaxed"}>{b.content}</p>;
      }
      case "image": {
        const b = block as any;
        const justify = b.align === "left" ? "justify-start" : b.align === "right" ? "justify-end" : "justify-center";
        return (
          <div className={`flex ${justify}`}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img src={b.src || "https://placehold.co/600x200?text=Imagem"} alt={b.alt || "Imagem"} style={{ width: b.width || 300 }} className={b.className} />
          </div>
        );
      }
      case "divider": {
        const b = block as any;
        return <div className={b.className || "my-4"}><hr className="border-muted-foreground/30" /></div>;
      }
      case "dynamic-field": {
        const b = block as any;
        return (
          <div className={b.className || ""}>
            <span className="text-muted-foreground mr-1">{b.label || b.field_name}:</span>
            <span className="font-medium">{`{{${b.field_name}}}`}</span>
          </div>
        );
      }
      case "system-variable": {
        const b = block as any;
        return (
          <div className={b.className || ""}>
            <span className="text-muted-foreground mr-1">{b.label || b.variable}:</span>
            <span className="font-medium">{`{{${b.variable}}}`}</span>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const renderEditor = () => {
    switch (block.type) {
      case "header": {
        const b = block as any;
        return (
          <div className="space-y-2">
            <Input value={b.content} onChange={(e) => onChange({ ...block, content: e.target.value })} placeholder="Conteúdo do título" />
            <Input value={b.className || ""} onChange={(e) => onChange({ ...block, className: e.target.value })} placeholder="Classes Tailwind (opcional)" />
          </div>
        );
      }
      case "text": {
        const b = block as any;
        return (
          <div className="space-y-2">
            <Textarea value={b.content} onChange={(e) => onChange({ ...block, content: e.target.value })} placeholder="Digite o texto..." />
            <Input value={b.className || ""} onChange={(e) => onChange({ ...block, className: e.target.value })} placeholder="Classes Tailwind (opcional)" />
          </div>
        );
      }
      case "image": {
        const b = block as any;
        return (
          <div className="space-y-2">
            <Input value={b.src} onChange={(e) => onChange({ ...block, src: e.target.value })} placeholder="URL da imagem" />
            <Input value={b.alt || ""} onChange={(e) => onChange({ ...block, alt: e.target.value })} placeholder="Texto alternativo" />
            <div className="flex gap-2">
              <Input type="number" value={b.width || 300} onChange={(e) => onChange({ ...block, width: Number(e.target.value) || 300 })} placeholder="Largura (px)" />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={b.align || "center"}
                onChange={(e) => onChange({ ...block, align: e.target.value as any })}
              >
                <option value="left">Esquerda</option>
                <option value="center">Centro</option>
                <option value="right">Direita</option>
              </select>
            </div>
            <Input value={b.className || ""} onChange={(e) => onChange({ ...block, className: e.target.value })} placeholder="Classes Tailwind (opcional)" />
          </div>
        );
      }
      case "divider": {
        const b = block as any;
        return (
          <div className="space-y-2">
            <Input value={b.className || ""} onChange={(e) => onChange({ ...block, className: e.target.value })} placeholder="Classes Tailwind (opcional)" />
          </div>
        );
      }
      case "dynamic-field": {
        const b = block as any;
        return (
          <div className="space-y-2">
            <Input value={b.label || ""} onChange={(e) => onChange({ ...block, label: e.target.value })} placeholder="Rótulo (opcional)" />
            <Input value={b.prefix || ""} onChange={(e) => onChange({ ...block, prefix: e.target.value })} placeholder="Prefixo (ex: R$)" />
            <Input value={b.suffix || ""} onChange={(e) => onChange({ ...block, suffix: e.target.value })} placeholder="Sufixo (ex: / mês)" />
            <Input value={b.className || ""} onChange={(e) => onChange({ ...block, className: e.target.value })} placeholder="Classes Tailwind (opcional)" />
          </div>
        );
      }
      case "system-variable": {
        const b = block as any;
        return (
          <div className="space-y-2">
            <Input value={b.label || ""} onChange={(e) => onChange({ ...block, label: e.target.value })} placeholder="Rótulo (opcional)" />
            <Input value={b.prefix || ""} onChange={(e) => onChange({ ...block, prefix: e.target.value })} placeholder="Prefixo (ex: R$)" />
            <Input value={b.suffix || ""} onChange={(e) => onChange({ ...block, suffix: e.target.value })} placeholder="Sufixo (ex: / mês)" />
            <Input value={b.className || ""} onChange={(e) => onChange({ ...block, className: e.target.value })} placeholder="Classes Tailwind (opcional)" />
          </div>
        );
      }
      default:
        return null;
    }
  };

  const iconForType = () => {
    switch (block.type) {
      case "header": return <Type className="h-4 w-4" />;
      case "text": return <Type className="h-4 w-4" />;
      case "image": return <ImageIcon className="h-4 w-4" />;
      case "divider": return <Minus className="h-4 w-4" />;
      case "dynamic-field": return <Variable className="h-4 w-4" />;
      case "system-variable": return <Variable className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group relative border bg-white p-4 ${isDragging ? "opacity-70" : ""}`}
    >
      <div className="absolute -left-10 top-3 hidden group-hover:flex items-center gap-1">
        <button
          className="inline-flex items-center justify-center h-6 w-6 rounded border bg-background text-muted-foreground"
          {...attributes}
          {...listeners}
          title="Arrastar"
        >
          <GripVertical className="h-3 w-3" />
        </button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {iconForType()}
          <span className="uppercase tracking-wide">{block.type}</span>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
          ) : (
            <>
              <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
                <SaveIcon className="h-4 w-4 mr-1" /> Concluir
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
            </>
          )}
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> Remover
          </Button>
        </div>
      </div>

      {!editing ? (
        <div className="min-h-6">{renderPreview()}</div>
      ) : (
        <div className="space-y-3">{renderEditor()}</div>
      )}
    </Card>
  );
}
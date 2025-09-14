"use client";

export type BlockType =
  | "header"
  | "text"
  | "image"
  | "divider"
  | "dynamic-field"
  | "system-variable";

export interface BaseBlock {
  id: string;
  type: BlockType;
  className?: string; // Tailwind classes
}

export interface HeaderBlock extends BaseBlock {
  type: "header";
  content: string;
  level?: 1 | 2 | 3;
}

export interface TextBlock extends BaseBlock {
  type: "text";
  content: string;
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  src: string;
  alt?: string;
  width?: number; // px
  align?: "left" | "center" | "right";
}

export interface DividerBlock extends BaseBlock {
  type: "divider";
}

export interface DynamicFieldBlock extends BaseBlock {
  type: "dynamic-field";
  field_name: string; // slug/nome do campo salvo no template_fields.field_name
  label?: string;     // rótulo visível
  format?: "text" | "currency" | "date" | "number";
  prefix?: string;
  suffix?: string;
}

export interface SystemVariableBlock extends BaseBlock {
  type: "system-variable";
  variable: string;   // key da variável do sistema
  label?: string;
  format?: "text" | "currency" | "date" | "number";
  prefix?: string;
  suffix?: string;
}

export type LayoutBlock =
  | HeaderBlock
  | TextBlock
  | ImageBlock
  | DividerBlock
  | DynamicFieldBlock
  | SystemVariableBlock;

export interface SystemVariableDef {
  key: string;
  label: string;
}

export const SYSTEM_VARIABLES: SystemVariableDef[] = [
  { key: "client_name", label: "Nome do Cliente" },
  { key: "company_name", label: "Nome da Empresa" },
  { key: "company_logo_url", label: "Logo da Empresa (URL)" },
  { key: "user_full_name", label: "Nome do Usuário" },
  { key: "proposal_value", label: "Valor da Proposta" },
  { key: "cedible_value", label: "Valor Cedível" },
  { key: "process_number", label: "Número do Processo" },
  { key: "organization_name", label: "Nome da Organização" },
  { key: "receiver_type", label: "Tipo de Destinatário" },
  { key: "valid_until", label: "Válida Até" }
];

export const newId = () => Math.random().toString(36).slice(2, 10);
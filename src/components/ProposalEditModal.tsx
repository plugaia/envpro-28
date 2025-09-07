"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type Proposal } from "./ProposalCard";
import { useUpdateProposal } from "@/hooks/useProposals";
import { nameSchema, emailSchema, phoneSchema, textSchema } from '@/lib/validation';
import InputMask from 'react-input-mask';

interface ProposalEditModalProps {
  proposal: Proposal;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const proposalEditSchema = z.object({
  clientName: nameSchema,
  clientEmail: emailSchema,
  clientPhone: phoneSchema,
  processNumber: textSchema(0, 50).optional(),
  organizationName: textSchema(0, 200).optional(),
  cedibleValue: z.number().positive("O valor deve ser maior que zero"),
  proposalValue: z.number().positive("O valor deve ser maior que zero"),
  receiverType: z.enum(['advogado', 'autor', 'precatorio']),
  status: z.enum(['pendente', 'aprovada', 'rejeitada']),
  description: textSchema(0, 2000).optional(),
});

type ProposalEditFormData = z.infer<typeof proposalEditSchema>;

export function ProposalEditModal({ proposal, isOpen, onClose, onUpdate }: ProposalEditModalProps) {
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm<ProposalEditFormData>({
    resolver: zodResolver(proposalEditSchema),
  });

  const updateProposalMutation = useUpdateProposal();

  useEffect(() => {
    if (proposal) {
      reset({
        clientName: proposal.clientName,
        clientEmail: proposal.clientEmail,
        clientPhone: proposal.clientPhone,
        processNumber: proposal.processNumber || "",
        organizationName: proposal.organizationName || "",
        cedibleValue: proposal.cedibleValue,
        proposalValue: proposal.proposalValue,
        receiverType: proposal.receiverType,
        status: proposal.status,
        description: ""
      });
    }
  }, [proposal, isOpen, reset]);

  const handleFormSubmit = async (data: ProposalEditFormData) => {
    await updateProposalMutation.mutateAsync({ id: proposal.id, data });
    onUpdate();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Proposta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Nome do Cliente*</Label><Input {...register("clientName")} />{errors.clientName && <p className="text-destructive text-sm">{errors.clientName.message}</p>}</div>
            <div><Label>Email do Cliente*</Label><Input type="email" {...register("clientEmail")} />{errors.clientEmail && <p className="text-destructive text-sm">{errors.clientEmail.message}</p>}</div>
          </div>
          <div><Label>Telefone do Cliente*</Label><Controller name="clientPhone" control={control} render={({ field }) => <InputMask mask="+55 (99) 99999-9999" value={field.value} onChange={field.onChange}><Input type="tel" /></InputMask>} />{errors.clientPhone && <p className="text-destructive text-sm">{errors.clientPhone.message}</p>}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Número do Processo</Label><Input {...register("processNumber")} />{errors.processNumber && <p className="text-destructive text-sm">{errors.processNumber.message}</p>}</div>
            <div><Label>Órgão/Devedor</Label><Input {...register("organizationName")} />{errors.organizationName && <p className="text-destructive text-sm">{errors.organizationName.message}</p>}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Valor Cedível (R$)*</Label><Input type="number" step="0.01" {...register("cedibleValue", { valueAsNumber: true })} />{errors.cedibleValue && <p className="text-destructive text-sm">{errors.cedibleValue.message}</p>}</div>
            <div><Label>Valor da Proposta (R$)*</Label><Input type="number" step="0.01" {...register("proposalValue", { valueAsNumber: true })} />{errors.proposalValue && <p className="text-destructive text-sm">{errors.proposalValue.message}</p>}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Tipo de Receptor*</Label><Controller name="receiverType" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="advogado">Advogado</SelectItem><SelectItem value="autor">Autor</SelectItem><SelectItem value="precatorio">Precatório</SelectItem></SelectContent></Select>
            )} />{errors.receiverType && <p className="text-destructive text-sm">{errors.receiverType.message}</p>}</div>
            <div><Label>Status*</Label><Controller name="status" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="aprovada">Aprovada</SelectItem><SelectItem value="rejeitada">Rejeitada</SelectItem></SelectContent></Select>
            )} />{errors.status && <p className="text-destructive text-sm">{errors.status.message}</p>}</div>
          </div>
          <div><Label>Descrição</Label><Textarea {...register("description")} rows={3} />{errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}</div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar Alterações"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
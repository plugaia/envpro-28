"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Send, User, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { nameSchema, emailSchema, phoneSchema, textSchema } from '@/lib/validation';
import InputMask from 'react-input-mask';
import { useQuery } from "@tanstack/react-query";

// Zod Schema for the form
const currencyStringToNumber = z.string()
  .min(1, "Valor é obrigatório")
  .refine(value => /R\$\s?(\d{1,3}(\.\d{3})*,\d{2})|(\d+([,.]\d{1,2})?)/.test(value), "Formato de moeda inválido")
  .transform(value => parseFloat(value.replace(/[R$\s.]/g, '').replace(',', '.')))
  .refine(value => !isNaN(value) && value > 0, "O valor deve ser maior que zero");

const proposalFormSchema = z.object({
  useExistingClient: z.boolean().default(false),
  selectedClientId: z.string().optional(),
  clientName: nameSchema,
  clientEmail: emailSchema,
  clientPhone: phoneSchema,
  processNumber: textSchema(0, 50).optional(),
  organizationName: textSchema(0, 200).optional(),
  cedibleValue: currencyStringToNumber,
  proposalValue: currencyStringToNumber,
  receiverType: z.enum(['advogado', 'autor', 'precatorio']),
  description: textSchema(0, 2000).optional(),
});

type ProposalFormData = z.infer<typeof proposalFormSchema>;

interface Client { id: string; name: string; email: string; phone: string; }
interface ProposalFormProps { onClose: () => void; onSubmit: () => void; }

const fetchClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase.from('clients').select('id, name, email, phone').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

export function ProposalForm({ onClose, onSubmit }: ProposalFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, watch, setValue } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: { receiverType: "advogado", useExistingClient: false }
  });

  const useExistingClient = watch("useExistingClient");
  const selectedClientId = watch("selectedClientId");

  const { data: clients = [] } = useQuery<Client[], Error>({
    queryKey: ['clients'],
    queryFn: fetchClients,
    enabled: useExistingClient,
  });

  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      if (client) {
        setValue("clientName", client.name);
        setValue("clientEmail", client.email);
        setValue("clientPhone", client.phone);
      }
    }
  }, [selectedClientId, clients, setValue]);

  const handleFormSubmit = async (data: ProposalFormData) => {
    if (!user) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('user_id', user.id).single();
      if (!profile) throw new Error('Perfil não encontrado');

      let clientId = data.selectedClientId;
      if (!data.useExistingClient) {
        const { data: existingClient } = await supabase.from('clients').select('id').eq('company_id', profile.company_id).eq('email', data.clientEmail).maybeSingle();
        if (existingClient) {
          clientId = existingClient.id;
        } else {
          const { data: newClient } = await supabase.from('clients').insert([{ company_id: profile.company_id, name: data.clientName, email: data.clientEmail, phone: data.clientPhone }]).select('id').single();
          if (!newClient) throw new Error("Falha ao criar cliente");
          clientId = newClient.id;
        }
      }

      const { data: proposalResult } = await supabase.from('proposals').insert([{
        company_id: profile.company_id,
        client_name: data.clientName,
        process_number: data.processNumber || null,
        organization_name: data.organizationName || null,
        cedible_value: data.cedibleValue,
        proposal_value: data.proposalValue,
        receiver_type: data.receiverType,
        description: data.description || null,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }]).select().single();
      if (!proposalResult) throw new Error("Falha ao criar proposta");

      await supabase.from('client_contacts').insert([{ proposal_id: proposalResult.id, client_id: clientId, email: data.clientEmail, phone: data.clientPhone }]);
      
      toast({ title: "Proposta criada", description: "A proposta foi criada com sucesso!" });
      onSubmit();
      onClose();
    } catch (error: any) {
      toast({ title: "Erro ao criar proposta", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Nova Proposta</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0"><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-medium flex items-center gap-2"><User className="w-4 h-4" /> Informações do Cliente</h3>
              <Controller name="useExistingClient" control={control} render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Switch id="use-existing-client" checked={field.value} onCheckedChange={field.onChange} />
                  <Label htmlFor="use-existing-client">Usar cliente existente</Label>
                </div>
              )} />
              {useExistingClient ? (
                <Controller name="selectedClientId" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Escolha um cliente..." /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name} - {c.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Nome*</Label><Input {...register("clientName")} />{errors.clientName && <p className="text-destructive text-sm">{errors.clientName.message}</p>}</div>
                    <div><Label>E-mail*</Label><Input type="email" {...register("clientEmail")} />{errors.clientEmail && <p className="text-destructive text-sm">{errors.clientEmail.message}</p>}</div>
                  </div>
                  <div><Label>Telefone*</Label><Controller name="clientPhone" control={control} render={({ field }) => <InputMask mask="+55 (99) 99999-9999" value={field.value} onChange={field.onChange}><Input type="tel" /></InputMask>} />{errors.clientPhone && <p className="text-destructive text-sm">{errors.clientPhone.message}</p>}</div>
                </>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nº do processo</Label><Input {...register("processNumber")} />{errors.processNumber && <p className="text-destructive text-sm">{errors.processNumber.message}</p>}</div>
              <div><Label>Órgão/Devedor</Label><Input {...register("organizationName")} />{errors.organizationName && <p className="text-destructive text-sm">{errors.organizationName.message}</p>}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Valor Cedível*</Label><Input {...register("cedibleValue")} />{errors.cedibleValue && <p className="text-destructive text-sm">{errors.cedibleValue.message}</p>}</div>
              <div><Label>Valor da proposta*</Label><Input {...register("proposalValue")} />{errors.proposalValue && <p className="text-destructive text-sm">{errors.proposalValue.message}</p>}</div>
            </div>
            <div><Label>Tipo do recebedor*</Label><Controller name="receiverType" control={control} render={({ field }) => (
              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="advogado" id="advogado" /><Label htmlFor="advogado">Advogado</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="autor" id="autor" /><Label htmlFor="autor">Autor</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="precatorio" id="precatorio" /><Label htmlFor="precatorio">Precatório</Label></div>
              </RadioGroup>
            )} />{errors.receiverType && <p className="text-destructive text-sm">{errors.receiverType.message}</p>}</div>
            <div><Label>Descrição</Label><Input {...register("description")} />{errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}</div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}><Send className="w-4 h-4 mr-2" />{isSubmitting ? "SALVANDO..." : "SALVAR PROPOSTA"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
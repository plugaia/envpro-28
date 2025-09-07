import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddClient, useUpdateClient, type Client } from "@/hooks/useClients";
import { baseNameValidation, emailSchema, phoneSchema, sanitizeInput } from "@/lib/validation";
import InputMask from 'react-input-mask';

interface ClientFormModalProps {
  client?: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

const clientSchema = z.object({
  name: baseNameValidation
    .min(5, "Nome completo é obrigatório")
    .transform(sanitizeInput),
  email: emailSchema,
  phone: phoneSchema,
});

type ClientFormData = z.infer<typeof clientSchema>;

export function ClientFormModal({ client, isOpen, onClose }: ClientFormModalProps) {
  const isEditMode = !!client;
  const addClientMutation = useAddClient();
  const updateClientMutation = useUpdateClient();

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        reset({
          name: client.name,
          email: client.email,
          phone: client.phone,
        });
      } else {
        reset({ name: "", email: "", phone: "" });
      }
    }
  }, [client, isOpen, reset, isEditMode]);

  const handleFormSubmit = async (data: ClientFormData) => {
    if (isEditMode) {
      await updateClientMutation.mutateAsync({ id: client.id, ...data });
    } else {
      await addClientMutation.mutateAsync(data);
    }
    onClose();
  };

  const isLoading = addClientMutation.isPending || updateClientMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Atualize as informações do cliente." : "Adicione um novo cliente à sua lista."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome Completo*</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">E-mail*</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="phone">WhatsApp*</Label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <InputMask mask="+55 (99) 99999-9999" value={field.value} onChange={field.onChange}>
                  {(inputProps: any) => <Input {...inputProps} id="phone" type="tel" />}
                </InputMask>
              )}
            />
            {errors.phone && <p className="text-destructive text-sm">{errors.phone.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : isEditMode ? "Salvar Alterações" : "Adicionar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
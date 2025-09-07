"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCompany, useUpdateCompany } from "@/hooks/useCompany";
import { Building2, Save, Upload, X, ImageIcon } from "lucide-react";
import { companyUpdateSchema } from "@/lib/validation";
import InputMask from 'react-input-mask';

type CompanyFormData = Zod.infer<typeof companyUpdateSchema>;

export function CompanySettings() {
  const { user } = useAuth();
  const { data: company, isLoading: isCompanyLoading } = useCompany();
  const updateCompanyMutation = useUpdateCompany();
  // Note: Logo upload logic can be moved to useCompany hook later if needed
  const [logoUploading, setLogoUploading] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<CompanyFormData>({
    resolver: zodResolver(companyUpdateSchema),
  });

  useEffect(() => {
    if (company) {
      reset({
        name: company.name || "",
        cnpj: company.cnpj || "",
        responsiblePhone: company.responsible_phone || "",
        responsibleEmail: company.responsible_email || "",
        addressStreet: company.address_street || "",
        addressNumber: company.address_number || "",
        addressComplement: company.address_complement || "",
        addressNeighborhood: company.address_neighborhood || "",
        addressCity: company.address_city || "",
        addressState: company.address_state || "",
        addressZipCode: company.address_zip_code || "",
      });
    }
  }, [company, reset]);

  const handleSaveCompany = (data: CompanyFormData) => {
    const updateData = {
      name: data.name,
      cnpj: data.cnpj,
      responsible_phone: data.responsiblePhone,
      responsible_email: data.responsibleEmail,
      address_street: data.addressStreet,
      address_number: data.addressNumber,
      address_complement: data.addressComplement,
      address_neighborhood: data.addressNeighborhood,
      address_city: data.addressCity,
      address_state: data.addressState,
      address_zip_code: data.addressZipCode,
    };
    updateCompanyMutation.mutate(updateData);
  };
  
  // Placeholder for logo upload logic - can be moved to the hook
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {};
  const handleRemoveLogo = async () => {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Dados da Empresa</CardTitle>
        <CardDescription>Gerencie as informações da sua empresa</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Logo da Empresa</Label>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-20 h-20 border-2 border-dashed rounded-lg bg-muted/50">
              {company?.logo_url ? <img src={company.logo_url} alt="Logo" className="w-full h-full object-contain rounded-lg" /> : <ImageIcon className="w-8 h-8 text-muted-foreground" />}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled asChild><label className="cursor-pointer"><Upload className="w-4 h-4 mr-2" />Enviar Logo<input type="file" className="hidden" /></label></Button>
                {company?.logo_url && <Button variant="outline" size="sm" disabled><X className="w-4 h-4 mr-2" />Remover</Button>}
              </div>
              <p className="text-sm text-muted-foreground">Máximo 10MB. JPG, PNG, GIF.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleSaveCompany)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="name">Nome da Empresa</Label><Input id="name" {...register("name")} />{errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}</div>
            <div><Label htmlFor="cnpj">CNPJ</Label><Input id="cnpj" {...register("cnpj")} />{errors.cnpj && <p className="text-destructive text-sm">{errors.cnpj.message}</p>}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="responsiblePhone">Telefone Responsável</Label><InputMask mask="+55 (99) 99999-9999" {...register("responsiblePhone")}><Input id="responsiblePhone" type="tel" /></InputMask>{errors.responsiblePhone && <p className="text-destructive text-sm">{errors.responsiblePhone.message}</p>}</div>
            <div><Label htmlFor="responsibleEmail">Email Responsável</Label><Input id="responsibleEmail" type="email" {...register("responsibleEmail")} />{errors.responsibleEmail && <p className="text-destructive text-sm">{errors.responsibleEmail.message}</p>}</div>
          </div>
          
          <h4 className="font-medium pt-2">Endereço</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2"><Label htmlFor="addressStreet">Rua</Label><Input id="addressStreet" {...register("addressStreet")} /></div>
            <div><Label htmlFor="addressNumber">Número</Label><Input id="addressNumber" {...register("addressNumber")} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="addressComplement">Complemento</Label><Input id="addressComplement" {...register("addressComplement")} /></div>
            <div><Label htmlFor="addressNeighborhood">Bairro</Label><Input id="addressNeighborhood" {...register("addressNeighborhood")} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label htmlFor="addressCity">Cidade</Label><Input id="addressCity" {...register("addressCity")} /></div>
            <div><Label htmlFor="addressState">Estado</Label><Input id="addressState" maxLength={2} {...register("addressState")} /></div>
            <div><Label htmlFor="addressZipCode">CEP</Label><Input id="addressZipCode" {...register("addressZipCode")} /></div>
          </div>

          <Button type="submit" disabled={updateCompanyMutation.isPending || !isDirty} className="w-full sm:w-auto">
            <Save className="w-4 h-4 mr-2" />
            {updateCompanyMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
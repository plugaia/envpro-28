import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Save, Upload, X, ImageIcon } from "lucide-react";
import { companyUpdateSchema } from "@/lib/validation";

export function CompanySettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [company, setCompany] = useState({
    name: "",
    cnpj: "",
    responsible_phone: "",
    responsible_email: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    address_zip_code: "",
    logo_url: ""
  });

  useEffect(() => {
    if (user) {
      fetchCompany();
    }
  }, [user]);

  const fetchCompany = async () => {
    if (!user) return;

    try {
      // First get user's profile to find company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Then get company data
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();

      if (error) throw error;

      setCompany({
        name: data.name || "",
        cnpj: data.cnpj || "",
        responsible_phone: data.responsible_phone || "",
        responsible_email: data.responsible_email || "",
        address_street: data.address_street || "",
        address_number: data.address_number || "",
        address_complement: data.address_complement || "",
        address_neighborhood: data.address_neighborhood || "",
        address_city: data.address_city || "",
        address_state: data.address_state || "",
        address_zip_code: data.address_zip_code || "",
        logo_url: (data as any).logo_url || ""
      });
    } catch (error) {
      console.error('Error fetching company:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da empresa.",
        variant: "destructive",
      });
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setLogoUploading(true);

    try {
      // Get company ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `company-logo-${profile.company_id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);

      // Update company record with logo URL
      const { error: updateError } = await supabase
        .from('companies')
        .update({ 
          logo_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.company_id);

      if (updateError) throw updateError;

      setCompany(prev => ({ ...prev, logo_url: urlData.publicUrl }));

      toast({
        title: "Logo atualizado",
        description: "O logo da empresa foi salvo com sucesso.",
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível fazer upload do logo.",
        variant: "destructive",
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!user || !company.logo_url) return;

    try {
      // Get company ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Remove logo URL from database
      const { error: updateError } = await supabase
        .from('companies')
        .update({ 
          logo_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.company_id);

      if (updateError) throw updateError;

      setCompany(prev => ({ ...prev, logo_url: "" }));

      toast({
        title: "Logo removido",
        description: "O logo da empresa foi removido com sucesso.",
      });
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o logo.",
        variant: "destructive",
      });
    }
  };

  const handleSaveCompany = async () => {
    if (!user) return;

    try {
      // Validate input
      const validatedData = companyUpdateSchema.parse({
        name: company.name,
        cnpj: company.cnpj,
        responsiblePhone: company.responsible_phone,
        responsibleEmail: company.responsible_email,
        addressStreet: company.address_street || undefined,
        addressNumber: company.address_number || undefined,
        addressComplement: company.address_complement || undefined,
        addressNeighborhood: company.address_neighborhood || undefined,
        addressCity: company.address_city || undefined,
        addressState: company.address_state || undefined,
        addressZipCode: company.address_zip_code || undefined
      });

      setLoading(true);

      // Get user's profile to find company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const updateData: any = {
        name: validatedData.name,
        cnpj: validatedData.cnpj,
        responsible_phone: validatedData.responsiblePhone,
        responsible_email: validatedData.responsibleEmail,
        address_street: validatedData.addressStreet,
        address_number: validatedData.addressNumber,
        address_complement: validatedData.addressComplement,
        address_neighborhood: validatedData.addressNeighborhood,
        address_city: validatedData.addressCity,
        address_state: validatedData.addressState,
        address_zip_code: validatedData.addressZipCode,
        updated_at: new Date().toISOString(),
      };

      // Include logo_url if it exists
      if (company.logo_url) {
        updateData.logo_url = company.logo_url;
      }

      const { error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', profile.company_id);

      if (error) throw error;

      // Log the company update
      await supabase.rpc('create_audit_log', {
        p_action_type: 'COMPANY_UPDATE',
        p_table_name: 'companies',
        p_new_data: validatedData
      });

      toast({
        title: "Empresa atualizada",
        description: "Os dados da empresa foram salvos com sucesso.",
      });
    } catch (error: any) {
      console.error('Error updating company:', error);
      toast({
        title: "Erro ao salvar",
        description: error.errors?.[0]?.message || "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Dados da Empresa
        </CardTitle>
        <CardDescription>
          Gerencie as informações da sua empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload Section */}
        <div className="space-y-4">
          <Label>Logo da Empresa</Label>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50">
              {company.logo_url ? (
                <img 
                  src={company.logo_url} 
                  alt="Logo da empresa" 
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logoUploading}
                  asChild
                >
                  <label className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    {logoUploading ? "Enviando..." : "Enviar Logo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </Button>
                {company.logo_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: JPG, PNG, GIF. Máximo 5MB.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nome da Empresa</Label>
            <Input 
              id="companyName" 
              placeholder="Nome da empresa" 
              value={company.name}
              onChange={(e) => setCompany(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input 
              id="cnpj" 
              placeholder="00.000.000/0001-00" 
              value={company.cnpj}
              onChange={(e) => setCompany(prev => ({ ...prev, cnpj: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="responsiblePhone">Telefone Responsável</Label>
            <Input 
              id="responsiblePhone" 
              placeholder="+55 67 99999-9999" 
              value={company.responsible_phone}
              onChange={(e) => setCompany(prev => ({ ...prev, responsible_phone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsibleEmail">Email Responsável</Label>
            <Input 
              id="responsibleEmail" 
              type="email"
              placeholder="responsavel@empresa.com" 
              value={company.responsible_email}
              onChange={(e) => setCompany(prev => ({ ...prev, responsible_email: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Endereço</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street">Rua</Label>
              <Input 
                id="street" 
                placeholder="Rua das Flores" 
                value={company.address_street}
                onChange={(e) => setCompany(prev => ({ ...prev, address_street: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input 
                id="number" 
                placeholder="123" 
                value={company.address_number}
                onChange={(e) => setCompany(prev => ({ ...prev, address_number: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input 
                id="complement" 
                placeholder="Apto 45" 
                value={company.address_complement}
                onChange={(e) => setCompany(prev => ({ ...prev, address_complement: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input 
                id="neighborhood" 
                placeholder="Centro" 
                value={company.address_neighborhood}
                onChange={(e) => setCompany(prev => ({ ...prev, address_neighborhood: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input 
                id="city" 
                placeholder="São Paulo" 
                value={company.address_city}
                onChange={(e) => setCompany(prev => ({ ...prev, address_city: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input 
                id="state" 
                placeholder="SP" 
                maxLength={2}
                value={company.address_state}
                onChange={(e) => setCompany(prev => ({ ...prev, address_state: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <Input 
                id="zipCode" 
                placeholder="01234-567" 
                value={company.address_zip_code}
                onChange={(e) => setCompany(prev => ({ ...prev, address_zip_code: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSaveCompany} 
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </CardContent>
    </Card>
  );
}
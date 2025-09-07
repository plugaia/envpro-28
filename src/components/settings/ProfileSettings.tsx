"use client";

import { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile, useUpdateAvatar } from "@/hooks/useProfile";
import { User, Save, Camera, Upload } from "lucide-react";
import { nameSchema, phoneSchema } from "@/lib/validation";
import InputMask from 'react-input-mask';

const profileSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  phone: phoneSchema.nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileSettings() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const updateAvatarMutation = useUpdateAvatar();

  const { register, handleSubmit, control, formState: { errors, isDirty }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile, reset]);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    updateAvatarMutation.mutate(file);
  };

  const handleSaveProfile = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Perfil do Usuário</CardTitle>
        <CardDescription>Atualize suas informações pessoais</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile?.avatar_url || undefined} alt="Foto do perfil" />
              <AvatarFallback className="text-lg">
                {profile?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <Button size="sm" variant="secondary" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0" onClick={() => fileInputRef.current?.click()} disabled={updateAvatarMutation.isPending}>
              {updateAvatarMutation.isPending ? <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" /> : <Camera className="h-4 w-4" />}
            </Button>
          </div>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={updateAvatarMutation.isPending} className="gap-2">
            <Upload className="h-4 w-4 mr-2" />
            {updateAvatarMutation.isPending ? "Enviando..." : "Alterar Foto"}
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
        </div>

        <form onSubmit={handleSubmit(handleSaveProfile)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="first_name">Nome</Label><Input id="first_name" {...register("first_name")} />{errors.first_name && <p className="text-destructive text-sm">{errors.first_name.message}</p>}</div>
            <div><Label htmlFor="last_name">Sobrenome</Label><Input id="last_name" {...register("last_name")} />{errors.last_name && <p className="text-destructive text-sm">{errors.last_name.message}</p>}</div>
          </div>
          <div><Label htmlFor="phone">WhatsApp</Label><Controller name="phone" control={control} render={({ field }) => <InputMask mask="+55 (99) 99999-9999" value={field.value || ''} onChange={field.onChange}><Input id="phone" type="tel" /></InputMask>} />{errors.phone && <p className="text-destructive text-sm">{errors.phone.message}</p>}</div>
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={user?.email || ""} disabled /></div>
          <Button type="submit" disabled={updateProfileMutation.isPending || !isDirty} className="w-full sm:w-auto">
            <Save className="w-4 h-4 mr-2" />
            {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
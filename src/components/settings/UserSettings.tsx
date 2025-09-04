import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Search, Edit, Trash2, UserCheck, Mail, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'collaborator';
  isActive: boolean;
  createdAt: Date;
}

const roleLabels = {
  admin: 'Administrador',
  collaborator: 'Colaborador'
};

export function UserSettings() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    firstName: "",
    lastName: "", 
    email: ""
  });
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all users from profiles table (includes role)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          first_name,
          last_name,
          role,
          is_active,
          created_at
        `);

      if (profilesError) {
        if (profilesError.message.includes('permission denied')) {
          toast({
            title: "Acesso restrito",
            description: "Apenas administradores podem visualizar usuários.",
            variant: "destructive",
          });
          return;
        }
        throw profilesError;
      }

      // Create simplified users list from profile data
      const combinedUsers: User[] = profilesData.map(profile => ({
        id: profile.user_id,
        email: `user-${profile.user_id.slice(0, 8)}@empresa.com`, // Placeholder since we can't access auth.users
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        role: profile.role as 'admin' | 'collaborator',
        isActive: profile.is_active,
        createdAt: new Date(profile.created_at)
      }));

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteForm.firstName.trim() || !inviteForm.lastName.trim() || !inviteForm.email.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome, sobrenome e email.",
        variant: "destructive",
      });
      return;
    }

    try {
      setInviteLoading(true);
      
      console.log('Starting invitation process...');
      console.log('Current user:', currentUser);
      console.log('User ID:', currentUser?.id);
      
      // Check if user is authenticated
      if (!currentUser || !currentUser.id) {
        throw new Error('Usuário não autenticado');
      }

      // Validate email availability using Supabase function
      const { data: emailCheck, error: emailCheckError } = await supabase.functions.invoke('check-email-availability', {
        body: { email: inviteForm.email }
      });

      if (emailCheckError) {
        console.error('Email check error:', emailCheckError);
        throw new Error('Erro ao verificar disponibilidade do email');
      }

      if (!emailCheck.available) {
        toast({
          title: "Email já cadastrado",
          description: "Este email já está sendo usado por outro usuário.",
          variant: "destructive",
        });
        return;
      }
      
      // Test admin status using the correct function
      const { data: adminCheck, error: adminError } = await supabase
        .rpc('is_admin', { user_id: currentUser?.id });
      
      console.log('Admin check result:', { adminCheck, adminError });
      
      // Also check profile directly
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('user_id', currentUser.id)
        .single();
        
      console.log('Profile check:', { profileData, profileError });
      
      if (adminError) {
        console.error('Admin check error:', adminError);
        throw new Error('Erro ao verificar permissões de administrador');
      }
      
      if (!adminCheck) {
        throw new Error('Você precisa ter permissões de administrador para enviar convites.');
      }

      // Create team invitation
      const { data, error } = await supabase
        .rpc('create_team_invitation', {
          p_email: inviteForm.email,
          p_first_name: inviteForm.firstName,
          p_last_name: inviteForm.lastName,
          p_whatsapp_number: null
        });
        
      console.log('RPC result:', { data, error });

      if (error) throw error;

      // Send invitation email via edge function
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          email: inviteForm.email,
          firstName: inviteForm.firstName,
          lastName: inviteForm.lastName
        }
      });

      console.log('Email result:', { emailResult, emailError });

      if (emailError) {
        console.error('Email error:', emailError);
        toast({
          title: "Aviso",
          description: "Convite criado mas houve erro ao enviar email. Verifique se a chave RESEND_API_KEY está configurada.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Convite enviado!",
        description: `Convite enviado por email para ${inviteForm.email}`,
      });

      setInviteForm({ firstName: "", lastName: "", email: "" });
      setShowInviteDialog(false);
      
      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast({
        title: "Erro ao criar convite",
        description: "Não foi possível criar o convite. Verifique se você tem permissão de administrador.",
        variant: "destructive",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'collaborator') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast({
        title: "Perfil atualizado",
        description: `Perfil do usuário atualizado para ${roleLabels[newRole]}.`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Erro ao atualizar perfil",
        description: "Não foi possível atualizar o perfil do usuário.",
        variant: "destructive",
      });
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isActive: !isActive } : user
      ));

      toast({
        title: "Status atualizado",
        description: `Usuário ${!isActive ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do usuário.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>
                  Gerencie usuários e suas permissões no sistema
                </CardDescription>
              </div>
            </div>
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary-hover">
                  <Plus className="w-4 h-4 mr-2" />
                  Convidar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convidar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Crie um convite para um novo usuário se juntar à equipe.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nome</Label>
                      <Input
                        id="firstName"
                        placeholder="Nome"
                        value={inviteForm.firstName}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Sobrenome</Label>
                      <Input
                        id="lastName"
                        placeholder="Sobrenome"
                        value={inviteForm.lastName}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@email.com"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                     />
                   </div>
                   <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowInviteDialog(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={async () => {
                        setInviteLoading(true);
                        try {
                          await handleInviteUser();
                          // Log audit event
                          try {
                            await supabase.rpc('create_audit_log', {
                              p_action_type: 'USER_INVITED',
                              p_new_data: { 
                                email: inviteForm.email,
                                name: `${inviteForm.firstName} ${inviteForm.lastName}`,
                                action: 'user_invitation_sent'
                              }
                            });
                          } catch (auditError) {
                            console.error('Audit log error:', auditError);
                          }
                        } finally {
                          setInviteLoading(false);
                        }
                      }}
                      disabled={inviteLoading}
                      className="flex-1"
                    >
                      {inviteLoading ? "Criando..." : "Criar Convite"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-destructive/10">
                <UserCheck className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-success/10">
                <UserCheck className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar usuários por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">
              {filteredUsers.length} de {users.length} usuários
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Usuário</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value: 'admin' | 'collaborator') => handleUpdateUserRole(user.id, value)}
                          disabled={user.id === currentUser?.id}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="collaborator">Colaborador</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              try {
                                await handleToggleUserStatus(user.id, user.isActive);
                                // Log audit event
                                try {
                                  await supabase.rpc('create_audit_log', {
                                    p_action_type: user.isActive ? 'USER_DEACTIVATED' : 'USER_ACTIVATED',
                                    p_table_name: 'profiles',
                                    p_record_id: user.id,
                                    p_new_data: { 
                                      user_name: `${user.firstName} ${user.lastName}`,
                                      action: user.isActive ? 'deactivated' : 'activated'
                                    }
                                  });
                                } catch (auditError) {
                                  console.error('Audit log error:', auditError);
                                }
                              } catch (error) {
                                console.error('Error toggling user status:', error);
                              }
                            }}
                            disabled={user.id === currentUser?.id}
                            className="h-8 w-8 p-0"
                            title={user.isActive ? "Desativar" : "Ativar"}
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredUsers.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Ajuste sua busca ou" : ""} convide um novo usuário para começar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
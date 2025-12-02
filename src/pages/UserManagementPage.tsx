import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState<string>("");

  const [newUser, setNewUser] = useState({
    user_name: "",
    user_email: "",
    role_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get first organization (aligned with existing RLS demo setup)
      const { data: org, error: orgError } = await supabase
        .from("organization")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (orgError) {
        console.error("Error loading organization:", orgError);
      }

      if (!org) {
        setOrganizationId("");
        setRoles([]);
        setUsers([]);
        return;
      }

      setOrganizationId(org.id);

      // Load roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("*")
        .order("role_name");

      if (rolesError) {
        console.error("Error loading roles:", rolesError);
      }

      setRoles(rolesData || []);

      // Load users with their roles
      const { data: usersData, error: usersError } = await supabase
        .from("organization_users")
        .select(`
          *,
          user_roles (
            role_id,
            roles (
              role_name,
              role_code
            )
          )
        `)
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false });

      if (usersError) {
        console.error("Error loading users:", usersError);
      }

      setUsers(usersData || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.user_name || !newUser.user_email || !newUser.role_id) {
        toast({
          title: "Errore",
          description: "Compila tutti i campi",
          variant: "destructive",
        });
        return;
      }

      if (!organizationId) {
        toast({
          title: "Errore",
          description: "Nessuna organizzazione selezionata",
          variant: "destructive",
        });
        return;
      }

      // Create organization user
      const { data: userData, error: userError } = await supabase
        .from("organization_users")
        .insert([
          {
            organization_id: organizationId,
            user_name: newUser.user_name,
            user_email: newUser.user_email,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (userError) throw userError;

      // Assign role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert([
          {
            user_id: userData.id,
            role_id: newUser.role_id,
            organization_id: organizationId,
          },
        ]);

      if (roleError) throw roleError;

      toast({
        title: "Successo",
        description: "Utente creato con successo",
      });

      setDialogOpen(false);
      setNewUser({ user_name: "", user_email: "", role_id: "" });
      loadData();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo utente?")) return;

    try {
      const { error } = await supabase.from("organization_users").delete().eq("id", userId);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Utente eliminato",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("organization_users")
        .update({ is_active: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Successo",
        description: currentStatus ? "Utente disattivato" : "Utente attivato",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (roleCode: string) => {
    const configs: Record<string, { variant: any; label: string }> = {
      SUPER_ADMIN: { variant: "destructive", label: "Super Admin" },
      ORG_ADMIN: { variant: "default", label: "Org Admin" },
      CISO: { variant: "default", label: "CISO" },
      AUDITOR: { variant: "secondary", label: "Auditor" },
      PROCESS_OWNER: { variant: "outline", label: "Process Owner" },
      EMPLOYEE: { variant: "outline", label: "Employee" },
      EXTERNAL_AUDITOR: { variant: "outline", label: "External Auditor" },
    };
    const config = configs[roleCode] || { variant: "outline", label: roleCode };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Caricamento...</div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="flex items-center gap-2">
            <Users className="h-8 w-8" />
            Gestione Utenti
          </h1>
          <p className="text-muted-foreground">Gestisci utenti e assegna ruoli</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Utente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea Nuovo Utente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={newUser.user_name}
                  onChange={(e) => setNewUser({ ...newUser, user_name: e.target.value })}
                  placeholder="Mario Rossi"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newUser.user_email}
                  onChange={(e) => setNewUser({ ...newUser, user_email: e.target.value })}
                  placeholder="mario.rossi@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Ruolo *</Label>
                <Select
                  value={newUser.role_id}
                  onValueChange={(value) => setNewUser({ ...newUser, role_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona ruolo" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.role_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleCreateUser}>Crea Utente</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totali Utenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card className="border-success/40 bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-success-foreground">
              Attivi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {users.filter((u) => u.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted bg-muted/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disattivati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {users.filter((u) => !u.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ruoli Disponibili
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
          </CardContent>
        </Card>
      </section>

      {/* Users Table */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Utenti Registrati</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="mb-4 h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">Nessun Utente</h3>
                <p className="mb-4 text-muted-foreground">
                  Inizia creando il primo utente dell'organizzazione
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crea Primo Utente
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ruolo</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Creato</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.user_name}</TableCell>
                      <TableCell>{user.user_email}</TableCell>
                      <TableCell>
                        {user.user_roles && user.user_roles.length > 0 ? (
                          getRoleBadge(user.user_roles[0].roles.role_code)
                        ) : (
                          <Badge variant="outline">Nessun Ruolo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "outline"}>
                          {user.is_active ? "Attivo" : "Disattivato"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString("it-IT")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                          >
                            {user.is_active ? "Disattiva" : "Attiva"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

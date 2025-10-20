import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteOrgId, setDeleteOrgId] = useState<string | null>(null);
  const [newOrgName, setNewOrgName] = useState("");

  // Get current user and their role
  const { data: userRole } = useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      return data?.role;
    },
  });

  // Get current user's profile with selected organization
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("profiles")
        .select("*, selected_organization_id")
        .eq("id", user.id)
        .single();
      
      return data;
    },
  });

  // Get all organizations
  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("organization")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Get current organization
  const { data: currentOrg, refetch: refetchCurrentOrg } = useQuery({
    queryKey: ["currentOrganization", profile?.selected_organization_id],
    queryFn: async () => {
      if (!profile?.selected_organization_id) return null;
      
      const { data } = await supabase
        .from("organization")
        .select("*")
        .eq("id", profile.selected_organization_id)
        .single();
      
      return data;
    },
    enabled: !!profile?.selected_organization_id,
  });

  const [orgData, setOrgData] = useState({
    name: "",
    sector: "",
    scope: "",
  });

  const [rolesData, setRolesData] = useState({
    ciso: "",
    dpo: "",
    ceo: "",
    cto: "",
    it_manager: "",
    hr_manager: "",
    system_administrator: "",
    help_desk_manager: "",
    responsabile_paghe: "",
    backup_operator: "",
    incident_response_manager: "",
    communication_manager: "",
  });

  // Update form data when currentOrg changes
  useState(() => {
    if (currentOrg) {
      setOrgData({
        name: currentOrg.name || "",
        sector: currentOrg.sector || "",
        scope: currentOrg.scope || "",
      });
      setRolesData({
        ciso: currentOrg.ciso || "",
        dpo: currentOrg.dpo || "",
        ceo: currentOrg.ceo || "",
        cto: currentOrg.cto || "",
        it_manager: currentOrg.it_manager || "",
        hr_manager: currentOrg.hr_manager || "",
        system_administrator: currentOrg.system_administrator || "",
        help_desk_manager: currentOrg.help_desk_manager || "",
        responsabile_paghe: currentOrg.responsabile_paghe || "",
        backup_operator: currentOrg.backup_operator || "",
        incident_response_manager: currentOrg.incident_response_manager || "",
        communication_manager: currentOrg.communication_manager || "",
      });
    }
  });

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("organization")
        .insert({ name })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setNewOrgName("");
      toast({ title: "Organizzazione creata con successo" });
    },
    onError: () => {
      toast({ title: "Errore nella creazione", variant: "destructive" });
    },
  });

  // Delete organization mutation
  const deleteOrgMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("organization")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast({ title: "Organizzazione eliminata" });
    },
    onError: () => {
      toast({ title: "Errore nell'eliminazione", variant: "destructive" });
    },
  });

  // Select organization mutation
  const selectOrgMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("profiles")
        .update({ selected_organization_id: orgId })
        .eq("id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["currentOrganization"] });
      toast({ title: "Organizzazione selezionata" });
    },
  });

  // Update organization data mutation
  const updateOrgDataMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrg?.id) throw new Error("No organization selected");
      
      const { error } = await supabase
        .from("organization")
        .update(orgData)
        .eq("id", currentOrg.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetchCurrentOrg();
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast({ title: "Dati organizzazione aggiornati" });
    },
    onError: () => {
      toast({ title: "Errore nell'aggiornamento", variant: "destructive" });
    },
  });

  // Update roles mutation
  const updateRolesMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrg?.id) throw new Error("No organization selected");
      
      const { error } = await supabase
        .from("organization")
        .update(rolesData)
        .eq("id", currentOrg.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetchCurrentOrg();
      toast({ title: "Ruoli aggiornati" });
    },
    onError: () => {
      toast({ title: "Errore nell'aggiornamento", variant: "destructive" });
    },
  });

  const isAdmin = userRole === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Impostazioni</h1>
        <p className="text-muted-foreground mt-2">
          Gestisci organizzazioni, dati aziendali e ruoli
        </p>
      </div>

      <Tabs defaultValue={isAdmin ? "organizations" : "data"} className="w-full">
        <TabsList>
          {isAdmin && <TabsTrigger value="organizations">Organizzazioni</TabsTrigger>}
          <TabsTrigger value="data">Dati Organizzazione</TabsTrigger>
          <TabsTrigger value="roles">Ruoli Aziendali</TabsTrigger>
        </TabsList>

        {/* TAB 1: Organizations (Admin only) */}
        {isAdmin && (
          <TabsContent value="organizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Aggiungi Organizzazione</CardTitle>
                <CardDescription>Crea una nuova organizzazione</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome organizzazione"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                  />
                  <Button
                    onClick={() => createOrgMutation.mutate(newOrgName)}
                    disabled={!newOrgName || createOrgMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizations?.map((org) => (
                <Card
                  key={org.id}
                  className={`cursor-pointer transition-all ${
                    org.id === profile?.selected_organization_id
                      ? "ring-2 ring-primary"
                      : "hover:border-primary"
                  }`}
                  onClick={() => selectOrgMutation.mutate(org.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{org.name}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteOrgId(org.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <CardDescription>
                      {org.sector || "Nessun settore specificato"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Creata il {new Date(org.created_at).toLocaleDateString("it-IT")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        {/* TAB 2: Organization Data */}
        <TabsContent value="data" className="space-y-4">
          {!currentOrg ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Nessuna organizzazione selezionata
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Dati Organizzazione</CardTitle>
                <CardDescription>
                  Modifica i dati dell'organizzazione corrente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Organizzazione</Label>
                  <Input
                    id="name"
                    value={orgData.name}
                    onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector">Settore</Label>
                  <Input
                    id="sector"
                    placeholder="es. Tecnologia, Sanità, Finanza"
                    value={orgData.sector}
                    onChange={(e) => setOrgData({ ...orgData, sector: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope">Ambito ISMS / Scope</Label>
                  <Textarea
                    id="scope"
                    placeholder="Descrivi l'ambito del sistema di gestione della sicurezza delle informazioni"
                    value={orgData.scope}
                    onChange={(e) => setOrgData({ ...orgData, scope: e.target.value })}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={() => updateOrgDataMutation.mutate()}
                  disabled={updateOrgDataMutation.isPending}
                >
                  Salva
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 3: Business Roles */}
        <TabsContent value="roles" className="space-y-4">
          {!currentOrg ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Nessuna organizzazione selezionata
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Ruoli Aziendali</CardTitle>
                <CardDescription>
                  Gestisci i ruoli chiave dell'organizzazione
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ciso">CISO</Label>
                    <Input
                      id="ciso"
                      placeholder="Nome responsabile sicurezza"
                      value={rolesData.ciso}
                      onChange={(e) => setRolesData({ ...rolesData, ciso: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dpo">DPO</Label>
                    <Input
                      id="dpo"
                      placeholder="Nome data protection officer"
                      value={rolesData.dpo}
                      onChange={(e) => setRolesData({ ...rolesData, dpo: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ceo">CEO</Label>
                    <Input
                      id="ceo"
                      placeholder="Nome amministratore delegato"
                      value={rolesData.ceo}
                      onChange={(e) => setRolesData({ ...rolesData, ceo: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cto">CTO</Label>
                    <Input
                      id="cto"
                      placeholder="Nome responsabile tecnologico"
                      value={rolesData.cto}
                      onChange={(e) => setRolesData({ ...rolesData, cto: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="it_manager">IT Manager</Label>
                    <Input
                      id="it_manager"
                      placeholder="Nome responsabile IT"
                      value={rolesData.it_manager}
                      onChange={(e) => setRolesData({ ...rolesData, it_manager: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hr_manager">HR Manager</Label>
                    <Input
                      id="hr_manager"
                      placeholder="Nome responsabile risorse umane"
                      value={rolesData.hr_manager}
                      onChange={(e) => setRolesData({ ...rolesData, hr_manager: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="system_administrator">System Administrator</Label>
                    <Input
                      id="system_administrator"
                      placeholder="Nome amministratore di sistema"
                      value={rolesData.system_administrator}
                      onChange={(e) => setRolesData({ ...rolesData, system_administrator: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="help_desk_manager">Help Desk Manager</Label>
                    <Input
                      id="help_desk_manager"
                      placeholder="Nome responsabile help desk"
                      value={rolesData.help_desk_manager}
                      onChange={(e) => setRolesData({ ...rolesData, help_desk_manager: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responsabile_paghe">Responsabile Paghe</Label>
                    <Input
                      id="responsabile_paghe"
                      placeholder="Nome responsabile paghe"
                      value={rolesData.responsabile_paghe}
                      onChange={(e) => setRolesData({ ...rolesData, responsabile_paghe: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backup_operator">Backup Operator</Label>
                    <Input
                      id="backup_operator"
                      placeholder="Nome operatore backup"
                      value={rolesData.backup_operator}
                      onChange={(e) => setRolesData({ ...rolesData, backup_operator: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="incident_response_manager">Incident Response Manager</Label>
                    <Input
                      id="incident_response_manager"
                      placeholder="Nome responsabile incident response"
                      value={rolesData.incident_response_manager}
                      onChange={(e) => setRolesData({ ...rolesData, incident_response_manager: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="communication_manager">Communication Manager</Label>
                    <Input
                      id="communication_manager"
                      placeholder="Nome responsabile comunicazione"
                      value={rolesData.communication_manager}
                      onChange={(e) => setRolesData({ ...rolesData, communication_manager: e.target.value })}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => updateRolesMutation.mutate()}
                  disabled={updateRolesMutation.isPending}
                >
                  Salva Ruoli
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteOrgId} onOpenChange={() => setDeleteOrgId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa organizzazione? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteOrgId) {
                  deleteOrgMutation.mutate(deleteOrgId);
                  setDeleteOrgId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

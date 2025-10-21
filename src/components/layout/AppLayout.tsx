import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
        .order("name");
      return data || [];
    },
  });

  // Get current organization
  const { data: currentOrg } = useQuery({
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

  // Select organization mutation
  const selectOrgMutation = useMutation({
    mutationFn: async (orgId: string) => {
      console.log("[AppLayout] Starting organization selection:", orgId);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("[AppLayout] Error getting user:", userError);
        throw new Error("User authentication failed");
      }
      if (!user) {
        console.error("[AppLayout] No user found");
        throw new Error("Not authenticated");
      }
      console.log("[AppLayout] User ID:", user.id);
      
      console.log("[AppLayout] Updating profile with org:", orgId);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ selected_organization_id: orgId })
        .eq("id", user.id);
      
      if (updateError) {
        console.error("[AppLayout] Error updating profile:", updateError);
        throw updateError;
      }
      console.log("[AppLayout] Profile updated successfully");
      
      // Get org name for toast
      const { data: org, error: orgError } = await supabase
        .from("organization")
        .select("name")
        .eq("id", orgId)
        .single();
      
      if (orgError) {
        console.error("[AppLayout] Error fetching org name:", orgError);
      }
      console.log("[AppLayout] Organization data:", org);
      
      return org;
    },
    onSuccess: (org) => {
      console.log("[AppLayout] Selection successful, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["currentOrganization"] });
      toast({ 
        title: `Organizzazione selezionata: ${org?.name || ""}`,
      });
    },
    onError: (error: any) => {
      console.error("[AppLayout] Full error object:", error);
      console.error("[AppLayout] Error message:", error?.message);
      console.error("[AppLayout] Error details:", error?.details);
      toast({ 
        title: "Errore nella selezione", 
        description: error?.message || "Impossibile selezionare l'organizzazione",
        variant: "destructive" 
      });
    },
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shadow-card">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h2 className="text-lg font-semibold text-foreground">
                Gestione ISO 27001:2022
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Organization Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Building2 className="h-4 w-4" />
                    {currentOrg?.name || "Seleziona Organizzazione"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card z-50">
                  {organizations?.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => {
                        console.log("[AppLayout] Dropdown item clicked:", org.name, org.id);
                        selectOrgMutation.mutate(org.id);
                      }}
                      className={
                        org.id === profile?.selected_organization_id
                          ? "bg-accent font-medium"
                          : ""
                      }
                    >
                      {org.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 bg-background">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

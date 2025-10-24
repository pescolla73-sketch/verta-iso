import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, User, Building2, AlertTriangle } from "lucide-react";
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
import { useState, useEffect } from "react";

// Development mode constants
const DEV_MODE = true; // Set to false for production
const DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@test.com',
  full_name: 'Demo User'
};

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Get current user's profile with selected organization
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Development mode: use mock user if no auth session
      if (!user && DEV_MODE) {
        console.log("[AppLayout] No auth session - using DEMO mode");
        setIsDemoMode(true);
        return {
          id: DEMO_USER.id,
          email: DEMO_USER.email,
          full_name: DEMO_USER.full_name,
          selected_organization_id: null
        };
      }
      
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
      
      // Development mode: skip auth checks
      if (DEV_MODE && isDemoMode) {
        console.log("[AppLayout] DEMO MODE - Simulating organization selection");
        
        // Just get org data without updating profile
        const { data: org, error: orgError } = await supabase
          .from("organization")
          .select("name")
          .eq("id", orgId)
          .single();
        
        if (orgError) {
          console.error("[AppLayout] Error fetching org:", orgError);
          throw orgError;
        }
        
        // Update local profile state
        queryClient.setQueryData(["profile"], (old: any) => ({
          ...old,
          selected_organization_id: orgId
        }));
        
        return org;
      }
      
      // Production mode: normal auth flow
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
          {/* Development Mode Banner */}
          {isDemoMode && DEV_MODE && (
            <div className="bg-yellow-500/20 border-b border-yellow-500/50 px-6 py-2 flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-700">⚠️ MODALITÀ SVILUPPO - Utente Demo Attivo</span>
            </div>
          )}
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shadow-card">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h2 className="text-lg font-semibold text-foreground">
                Gestione ISO 27001:2022
              </h2>
              {currentOrg && (
                <>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-lg font-bold text-foreground">
                    {currentOrg.name}
                  </span>
                  <span className="text-muted-foreground">|</span>
                </>
              )}
              {/* Organization Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {currentOrg ? (
                    <Button variant="ghost" size="icon" title="Cambia organizzazione">
                      <Building2 className="h-5 w-5" />
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="gap-2">
                      <Building2 className="h-4 w-4" />
                      Seleziona Organizzazione
                    </Button>
                  )}
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
            </div>
            <div className="flex items-center gap-3">
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

import { Bell, User, Building2, AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/RoleBadge";
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
import { useAuth } from "@/contexts/AuthContext";
import { ModernSidebar } from "../ModernSidebar";

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

interface SidebarStats {
  openNC: number;
  overdueNC: number;
  implementedControls: number;
}

export function AppLayout({ children }: AppLayoutProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { user, signOut } = useAuth();
  const [sidebarStats, setSidebarStats] = useState<SidebarStats>({
    openNC: 0,
    overdueNC: 0,
    implementedControls: 0,
  });

  // Load sidebar stats
  useEffect(() => {
    const loadSidebarStats = async () => {
      try {
        // Load non-conformities
        const { data: ncs } = await supabase
          .from("non_conformities")
          .select("id, deadline, status")
          .in("status", ["open", "in_progress"]);

        const openNC = ncs?.length || 0;
        const overdueNC = ncs?.filter((nc) => {
          if (!nc.deadline) return false;
          return new Date(nc.deadline) < new Date();
        }).length || 0;

        // Load implemented controls
        const { data: controls } = await supabase
          .from("controls")
          .select("id, status")
          .eq("status", "implemented");

        const implementedControls = controls?.length || 0;

        setSidebarStats({ openNC, overdueNC, implementedControls });
      } catch (error) {
        console.error("Error loading sidebar stats:", error);
      }
    };

    loadSidebarStats();
  }, []);

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
    <div className="min-h-screen flex w-full">
      <ModernSidebar 
        openNC={sidebarStats.openNC}
        overdueNC={sidebarStats.overdueNC}
        implementedControls={sidebarStats.implementedControls}
      />
      <div className="flex-1 flex flex-col">
        {/* Development Mode Banner */}
        {isDemoMode && DEV_MODE && (
          <div className="bg-amber-500/20 border-b border-amber-500/50 px-6 py-2 flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="font-medium text-amber-700">
              Modalita Sviluppo - Utente Demo Attivo
            </span>
          </div>
        )}
        <header className="h-14 border-b border-prof-border bg-prof-surface flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold" style={{ color: "hsl(var(--prof-text))" }}>
              Gestione ISO 27001:2022
            </h2>
            {currentOrg && (
              <>
                <span className="text-prof-muted">|</span>
                <span className="text-base font-bold" style={{ color: "hsl(var(--prof-text))" }}>
                  {currentOrg.name}
                </span>
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
                      console.log(
                        "[AppLayout] Dropdown item clicked:",
                        org.name,
                        org.id
                      );
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
            <RoleBadge />
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm" style={{ color: "hsl(var(--prof-text))" }}>
                  <User className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4" />
                  Esci
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => (window.location.href = "/login")}
              >
                Accedi
              </Button>
            )}
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 bg-prof-bg overflow-auto">{children}</main>
      </div>
    </div>
  );
}

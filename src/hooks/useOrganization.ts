import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Demo mode organization ID - this should match an existing organization in your database
const DEMO_ORGANIZATION_ID = "f3bd7c71-2755-43ad-ae20-ffd9c5f56d22";
const DEV_MODE = true; // Set to false for production

interface UseOrganizationResult {
  organizationId: string | null;
  isLoading: boolean;
  isDemoMode: boolean;
  organization: any | null;
}

export function useOrganization(): UseOrganizationResult {
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isDemoMode = !authData && DEV_MODE;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", authData?.id],
    queryFn: async () => {
      if (!authData) return null;
      
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.id)
        .single();
      
      return data;
    },
    enabled: !!authData,
  });

  // Determine the effective organization ID
  const getEffectiveOrganizationId = (): string | null => {
    // Demo mode: always use the demo organization
    if (isDemoMode) {
      return DEMO_ORGANIZATION_ID;
    }
    
    // Authenticated user: use their selected organization
    if (profile?.selected_organization_id) {
      return profile.selected_organization_id;
    }
    
    return null;
  };

  const effectiveOrgId = getEffectiveOrganizationId();

  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ["organization", effectiveOrgId],
    queryFn: async () => {
      if (!effectiveOrgId) return null;
      
      const { data } = await supabase
        .from("organization")
        .select("*")
        .eq("id", effectiveOrgId)
        .single();
      
      return data;
    },
    enabled: !!effectiveOrgId,
  });

  return {
    organizationId: effectiveOrgId,
    isLoading: authLoading || profileLoading || orgLoading,
    isDemoMode,
    organization,
  };
}

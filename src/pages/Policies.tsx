import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText, Library } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import PolicyGeneratorModal from "@/components/PolicyGeneratorModal";
import { PolicyTemplateLibrary } from "@/components/PolicyTemplateLibrary";
import { PolicyTemplate } from "@/data/policyTemplates";

export default function Policies() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);

  const { data: policies = [], refetch } = useQuery({
    queryKey: ["policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredPolicies = policies.filter(policy =>
    policy.policy_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statsData = {
    total: policies.length,
    approved: policies.filter(p => p.status === "approved").length,
    inReview: policies.filter(p => p.status === "in_review").length,
    draft: policies.filter(p => p.status === "draft").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success text-success-foreground">Approvata</Badge>;
      case "in_review":
        return <Badge className="bg-warning text-warning-foreground">In Revisione</Badge>;
      case "draft":
        return <Badge variant="outline">Bozza</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return "Approvata";
      case "in_review": return "In Revisione";
      case "draft": return "Bozza";
      default: return status;
    }
  };

  const handlePolicyGenerated = () => {
    setShowGeneratorModal(false);
    refetch();
  };

  const handleTemplateSelect = (template: PolicyTemplate) => {
    setShowTemplateLibrary(false);
    // Navigate to editor with template data
    navigate('/policy-editor', { 
      state: { 
        template,
        policyData: {
          policy_name: template.name,
          policy_type: template.id,
          sections: template.sections,
          template_id: template.id,
          iso_reference: template.iso_reference,
          nis2_reference: template.nis2_reference,
          category: template.category,
          status: 'draft',
          version: '1.0'
        }
      }
    });
  };

  return (
    <AppLayout>
      {showTemplateLibrary ? (
        <PolicyTemplateLibrary
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplateLibrary(false)}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Policy di Sicurezza</h1>
              <p className="text-muted-foreground mt-1">
                Gestisci e genera le policy di sicurezza ISO 27001
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTemplateLibrary(true)}>
                <Library className="h-4 w-4 mr-2" />
                Libreria Template
              </Button>
              <Button onClick={() => setShowGeneratorModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Genera con AI
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: "Totali", value: statsData.total },
              { label: "Approvate", value: statsData.approved },
              { label: "In Revisione", value: statsData.inReview },
              { label: "Bozze", value: statsData.draft },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-6 w-6" />
                    </div>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {stat.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Policy List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lista Policy</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca policy..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredPolicies.map((policy) => (
                  <div
                    key={policy.id}
                    onClick={() => navigate(`/policy-editor/${policy.id}`)}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          {policy.policy_name}
                        </h3>
                        {getStatusBadge(policy.status)}
                        <Badge variant="outline">{policy.version}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Approvata da:</span>{" "}
                          {policy.approved_by || "-"}
                        </div>
                        <div>
                          <span className="font-medium">Data creazione:</span>{" "}
                          {new Date(policy.created_at).toLocaleDateString('it-IT')}
                        </div>
                        <div>
                          <span className="font-medium">Stato:</span>{" "}
                          {getStatusLabel(policy.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Policy Generator Modal */}
          <PolicyGeneratorModal
            open={showGeneratorModal}
            onOpenChange={setShowGeneratorModal}
            onPolicyGenerated={handlePolicyGenerated}
          />
        </div>
      )}
    </AppLayout>
  );
}

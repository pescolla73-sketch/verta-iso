import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PolicyGeneratorModal from "@/components/PolicyGeneratorModal";

export default function Policies() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Gestione Politiche</h1>
          <p className="text-muted-foreground mt-2">
            Documenta e gestisci le politiche di sicurezza
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Genera Nuova Politica
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Totali", value: statsData.total },
          { label: "Approvate", value: statsData.approved },
          { label: "In Revisione", value: statsData.inReview },
          { label: "Bozze", value: statsData.draft },
        ].map((stat) => (
          <Card key={stat.label} className="shadow-card">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {stat.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista Politiche</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca politiche..."
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
                onClick={() => navigate(`/policies/${policy.id}`)}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">
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

      <PolicyGeneratorModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onPolicyGenerated={refetch}
      />
    </div>
  );
}

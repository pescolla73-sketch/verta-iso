import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PolicyNavigation } from "@/components/PolicyNavigation";
import { PolicyEditor as PolicyEditorComponent } from "@/components/PolicyEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PolicyEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id || id === 'new') {
    return (
      <AppLayout>
        <PolicyNavigation currentPage="Nuova Policy" />
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">
            Creazione nuova policy non ancora implementata
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/policies')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alle Policy
          </Button>
        </div>

        <PolicyEditorComponent 
          policyId={id}
          onSaved={() => {
            // Force hard reload to ensure fresh data
            setTimeout(() => {
              window.location.href = '/policies';
            }, 300);
          }}
        />
      </div>
    </AppLayout>
  );
}

import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wand2, Table2 } from "lucide-react";

export function ControlsViewToggle() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isWizardView = location.pathname === "/controls/wizard";
  const isTableView = location.pathname === "/controls/table";

  if (!isWizardView && !isTableView) return null;

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm text-muted-foreground">Vista:</span>
      <div className="flex gap-1">
        <Button
          variant={isWizardView ? "default" : "outline"}
          size="sm"
          onClick={() => navigate("/controls/wizard")}
          className="gap-2"
        >
          <Wand2 className="h-4 w-4" />
          Wizard
        </Button>
        <Button
          variant={isTableView ? "default" : "outline"}
          size="sm"
          onClick={() => navigate("/controls/table")}
          className="gap-2"
        >
          <Table2 className="h-4 w-4" />
          Tabella
        </Button>
      </div>
    </div>
  );
}

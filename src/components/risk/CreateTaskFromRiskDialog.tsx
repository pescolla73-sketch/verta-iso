import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Wrench, GraduationCap, ArrowRight } from "lucide-react";
import { logAuditEvent } from "@/utils/auditLog";
import { useOrganization } from "@/hooks/useOrganization";

interface CreateTaskFromRiskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskData: {
    id: string;
    name: string;
    treatmentPlan?: string;
    treatmentDeadline?: string;
    treatmentResponsible?: string;
    treatmentCost?: number;
  };
}

type TaskType = "improvement" | "training";

export function CreateTaskFromRiskDialog({
  open,
  onOpenChange,
  riskData,
}: CreateTaskFromRiskDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  
  const [taskType, setTaskType] = useState<TaskType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state for improvement action
  const [improvementForm, setImprovementForm] = useState({
    title: `Mitigazione: ${riskData.name}`,
    description: riskData.treatmentPlan || "",
    responsible_person: riskData.treatmentResponsible || "",
    target_date: riskData.treatmentDeadline || "",
    priority: "medium",
    estimated_cost: riskData.treatmentCost?.toString() || "",
  });

  // Form state for training
  const [trainingForm, setTrainingForm] = useState({
    employee_name: riskData.treatmentResponsible || "",
    training_title: `Formazione su: ${riskData.name}`,
    training_type: "security_awareness",
    training_date: riskData.treatmentDeadline || "",
    notes: `Formazione derivata dal piano di trattamento del rischio: ${riskData.name}`,
  });

  const handleCreateImprovement = async () => {
    if (!organizationId) {
      toast.error("Nessuna organizzazione selezionata");
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate action code
      const { data: codeData } = await supabase.rpc('generate_improvement_code', {
        org_id: organizationId,
        action_type_param: 'corrective'
      });

      const saveData = {
        organization_id: organizationId,
        action_code: codeData || `IMP-${Date.now()}`,
        action_type: 'corrective',
        source: 'risk_assessment',
        source_id: riskData.id,
        title: improvementForm.title,
        description: improvementForm.description,
        action_plan: improvementForm.description,
        responsible_person: improvementForm.responsible_person,
        target_date: improvementForm.target_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: improvementForm.priority,
        estimated_cost: improvementForm.estimated_cost ? parseFloat(improvementForm.estimated_cost) : null,
        status: 'open',
        implementation_status: 'planned',
        effectiveness_verified: false,
      };

      const { data, error } = await supabase
        .from('improvement_actions')
        .insert(saveData)
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent({
        action: 'create',
        entityType: 'improvement_action',
        entityId: data.id,
        entityName: data.title,
        notes: `Created from risk treatment: ${riskData.name}`
      });

      await queryClient.invalidateQueries({ queryKey: ['improvement_actions'] });

      toast.success("✅ Azione di miglioramento creata!", {
        description: `${data.action_code} - ${data.title}`,
        action: {
          label: "Visualizza",
          onClick: () => navigate(`/improvement/${data.id}`)
        }
      });

      onOpenChange(false);
      setTaskType(null);
    } catch (error: any) {
      console.error("Error creating improvement action:", error);
      toast.error("Errore nella creazione", {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTraining = async () => {
    if (!organizationId) {
      toast.error("Nessuna organizzazione selezionata");
      return;
    }

    setIsSubmitting(true);
    try {
      const trainingData = {
        organization_id: organizationId,
        employee_name: trainingForm.employee_name,
        training_title: trainingForm.training_title,
        training_type: trainingForm.training_type,
        training_date: trainingForm.training_date || new Date().toISOString().split('T')[0],
        notes: trainingForm.notes,
        status: 'planned',
        certificate_issued: false,
      };

      const { data, error } = await supabase
        .from('training_records')
        .insert(trainingData)
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent({
        action: 'create',
        entityType: 'training_record',
        entityId: data.id,
        entityName: data.training_title,
        notes: `Created from risk treatment: ${riskData.name}`
      });

      await queryClient.invalidateQueries({ queryKey: ['training_records'] });

      toast.success("✅ Piano di formazione creato!", {
        description: `${data.training_title}`,
        action: {
          label: "Visualizza",
          onClick: () => navigate('/training')
        }
      });

      onOpenChange(false);
      setTaskType(null);
    } catch (error: any) {
      console.error("Error creating training:", error);
      toast.error("Errore nella creazione", {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setTaskType(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crea Task dal Piano di Trattamento</DialogTitle>
          <DialogDescription>
            Genera automaticamente un'azione di miglioramento o un piano di formazione
            basato sul piano di trattamento del rischio "{riskData.name}".
          </DialogDescription>
        </DialogHeader>

        {!taskType ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Seleziona il tipo di task da creare:
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => setTaskType("improvement")}
              >
                <Wrench className="h-8 w-8 text-primary" />
                <span>Azione di Miglioramento</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => setTaskType("training")}
              >
                <GraduationCap className="h-8 w-8 text-primary" />
                <span>Piano di Formazione</span>
              </Button>
            </div>
          </div>
        ) : taskType === "improvement" ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Titolo Azione *</Label>
              <Input
                value={improvementForm.title}
                onChange={(e) => setImprovementForm({ ...improvementForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrizione / Piano d'Azione *</Label>
              <Textarea
                value={improvementForm.description}
                onChange={(e) => setImprovementForm({ ...improvementForm, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsabile *</Label>
                <Input
                  value={improvementForm.responsible_person}
                  onChange={(e) => setImprovementForm({ ...improvementForm, responsible_person: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Scadenza</Label>
                <Input
                  type="date"
                  value={improvementForm.target_date}
                  onChange={(e) => setImprovementForm({ ...improvementForm, target_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priorità</Label>
                <Select
                  value={improvementForm.priority}
                  onValueChange={(v) => setImprovementForm({ ...improvementForm, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critica</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Bassa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Costo Stimato (€)</Label>
                <Input
                  type="number"
                  value={improvementForm.estimated_cost}
                  onChange={(e) => setImprovementForm({ ...improvementForm, estimated_cost: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setTaskType(null)}>
                Indietro
              </Button>
              <Button onClick={handleCreateImprovement} disabled={isSubmitting}>
                {isSubmitting ? "Creazione..." : "Crea Azione"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Dipendente *</Label>
              <Input
                value={trainingForm.employee_name}
                onChange={(e) => setTrainingForm({ ...trainingForm, employee_name: e.target.value })}
                placeholder="Chi deve seguire la formazione"
              />
            </div>
            <div className="space-y-2">
              <Label>Titolo Formazione *</Label>
              <Input
                value={trainingForm.training_title}
                onChange={(e) => setTrainingForm({ ...trainingForm, training_title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo Formazione</Label>
                <Select
                  value={trainingForm.training_type}
                  onValueChange={(v) => setTrainingForm({ ...trainingForm, training_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security_awareness">Security Awareness</SelectItem>
                    <SelectItem value="iso27001">ISO 27001</SelectItem>
                    <SelectItem value="gdpr">GDPR</SelectItem>
                    <SelectItem value="technical">Tecnico</SelectItem>
                    <SelectItem value="other">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data Prevista</Label>
                <Input
                  type="date"
                  value={trainingForm.training_date}
                  onChange={(e) => setTrainingForm({ ...trainingForm, training_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={trainingForm.notes}
                onChange={(e) => setTrainingForm({ ...trainingForm, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setTaskType(null)}>
                Indietro
              </Button>
              <Button onClick={handleCreateTraining} disabled={isSubmitting}>
                {isSubmitting ? "Creazione..." : "Crea Formazione"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

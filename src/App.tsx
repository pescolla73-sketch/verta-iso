import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RequireAuth } from "./components/RequireAuth";
import ModernDashboard from "./pages/ModernDashboard";
import Assets from "./pages/Assets";
import RiskAssessment from "./pages/RiskAssessment";
import Controls from "./pages/Controls";
import ControlsTable from "./pages/ControlsTable";
import ControlDetail from "./pages/ControlDetail";
import SoA from "./pages/SoA";
import Audits from "./pages/Audits";
import Audit from "./pages/Audit";
import Policies from "./pages/Policies";
import PolicyDetail from "./pages/PolicyDetail";
import PolicyManagementPage from "./pages/PolicyManagementPage";
import PolicyEditor from "./pages/PolicyEditor";
import PolicyView from "./pages/PolicyView";
import ProcedureManagementPage from "./pages/ProcedureManagementPage";
import ProcedureEditor from "./pages/ProcedureEditor";
import ProcedureView from "./pages/ProcedureView";
import Roles from "./pages/Roles";
import SetupAzienda from "./pages/SetupAzienda";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Wizard from "./pages/Wizard";
import ProgressPage from "./pages/ProgressPage";
import Training from "./pages/Training";
import Incidents from "./pages/Incidents";
import ManagementReview from "./pages/ManagementReview";
import ManagementReviewEditor from "./pages/ManagementReviewEditor";
import InternalAuditPage from "./pages/InternalAuditPage";
import AuditPlanPage from "./pages/AuditPlanPage";
import AuditExecutionPage from "./pages/AuditExecutionPage";
import CertificationAuditPage from "./pages/CertificationAuditPage";
import CertificationAuditEditor from "./pages/CertificationAuditEditor";
import AuditTrailPage from "./pages/AuditTrailPage";
import NonConformityPage from "./pages/NonConformityPage";
import NonConformityEditor from "./pages/NonConformityEditor";
import ContinuousImprovementPage from "./pages/ContinuousImprovementPage";
import ContinuousImprovementEditor from "./pages/ContinuousImprovementEditor";
import DocumentControlPage from "./pages/DocumentControlPage";
import DocumentControlEditor from "./pages/DocumentControlEditor";
import SecurityCheckPage from "./pages/SecurityCheckPage";
import SetupRBACSimplePage from "./pages/SetupRBACSimplePage";
import AnalyzeExistingRolesPage from "./pages/AnalyzeExistingRolesPage";
import UserManagementPage from "./pages/UserManagementPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import SetupPasswordPage from "./pages/SetupPasswordPage";
import FinalSecurityAuditPage from "./pages/FinalSecurityAuditPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout>
                  <ModernDashboard />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/assets"
            element={
              <AppLayout>
                <Assets />
              </AppLayout>
            }
          />
          <Route
            path="/risk-assessment"
            element={
              <ProtectedRoute resource="risks" action="read">
                <AppLayout>
                  <RiskAssessment />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/controls"
            element={
              <AppLayout>
                <Controls />
              </AppLayout>
            }
          />
          <Route
            path="/controls/wizard"
            element={
              <AppLayout>
                <Wizard />
              </AppLayout>
            }
          />
          <Route
            path="/controls/table"
            element={
              <AppLayout>
                <ControlsTable />
              </AppLayout>
            }
          />
          <Route
            path="/controls/:id"
            element={
              <AppLayout>
                <ControlDetail />
              </AppLayout>
            }
          />
          <Route
            path="/soa"
            element={
              <AppLayout>
                <SoA />
              </AppLayout>
            }
          />
          <Route
            path="/audits"
            element={
              <AppLayout>
                <Audits />
              </AppLayout>
            }
          />
          <Route
            path="/audit"
            element={
              <AppLayout>
                <Audit />
              </AppLayout>
            }
          />
          <Route
            path="/policies"
            element={
              <ProtectedRoute resource="policies" action="read">
                <AppLayout>
                  <PolicyManagementPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/policies/:id"
            element={
              <ProtectedRoute resource="policies" action="read">
                <AppLayout>
                  <PolicyView />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/policy-editor"
            element={
              <ProtectedRoute resource="policies" action="create">
                <AppLayout>
                  <PolicyEditor />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/policy-editor/:id"
            element={
              <ProtectedRoute resource="policies" action="create">
                <AppLayout>
                  <PolicyEditor />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/procedures"
            element={
              <AppLayout>
                <ProcedureManagementPage />
              </AppLayout>
            }
          />
          <Route
            path="/procedures/:id"
            element={
              <AppLayout>
                <ProcedureView />
              </AppLayout>
            }
          />
          <Route
            path="/procedures/:id/edit"
            element={
              <AppLayout>
                <ProcedureEditor />
              </AppLayout>
            }
          />
          <Route
            path="/roles"
            element={
              <AppLayout>
                <Roles />
              </AppLayout>
            }
          />
          <Route
            path="/setup-azienda"
            element={
              <ProtectedRoute requiredRoles={["SUPER_ADMIN", "ORG_ADMIN", "CISO"]}>
                <AppLayout>
                  <SetupAzienda />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <AppLayout>
                <Settings />
              </AppLayout>
            }
          />
          <Route
            path="/progress"
            element={
              <AppLayout>
                <ProgressPage />
              </AppLayout>
            }
          />
          <Route
            path="/training"
            element={
              <AppLayout>
                <Training />
              </AppLayout>
            }
          />
          <Route
            path="/incidents"
            element={
              <AppLayout>
                <Incidents />
              </AppLayout>
            }
          />
          <Route
            path="/management-review"
            element={
              <ProtectedRoute requiredRoles={["SUPER_ADMIN", "ORG_ADMIN", "CISO"]}>
                <AppLayout>
                  <ManagementReview />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/management-review/:id"
            element={
              <ProtectedRoute requiredRoles={["SUPER_ADMIN", "ORG_ADMIN", "CISO"]}>
                <AppLayout>
                  <ManagementReviewEditor />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/management-review/:id/edit"
            element={
              <ProtectedRoute requiredRoles={["SUPER_ADMIN", "ORG_ADMIN", "CISO"]}>
                <AppLayout>
                  <ManagementReviewEditor />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-interni"
            element={
              <ProtectedRoute resource="audits" action="read">
                <AppLayout>
                  <InternalAuditPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-interni/piano"
            element={
              <ProtectedRoute resource="audits" action="create">
                <AppLayout>
                  <AuditPlanPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-interni/esegui/:id"
            element={
              <ProtectedRoute resource="audits" action="update">
                <AppLayout>
                  <AuditExecutionPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-certificazione"
            element={
              <AppLayout>
                <CertificationAuditPage />
              </AppLayout>
            }
          />
          <Route
            path="/certification-audit"
            element={
              <AppLayout>
                <CertificationAuditPage />
              </AppLayout>
            }
          />
          <Route
            path="/certification-audit/new"
            element={
              <AppLayout>
                <CertificationAuditEditor />
              </AppLayout>
            }
          />
          <Route
            path="/certification-audit/:id"
            element={
              <AppLayout>
                <CertificationAuditEditor />
              </AppLayout>
            }
          />
          <Route
            path="/audit-trail"
            element={
              <AppLayout>
                <AuditTrailPage />
              </AppLayout>
            }
          />
          <Route
            path="/non-conformity"
            element={
              <ProtectedRoute resource="non_conformities" action="read">
                <AppLayout>
                  <NonConformityPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/non-conformity/new"
            element={
              <ProtectedRoute resource="non_conformities" action="create">
                <AppLayout>
                  <NonConformityEditor />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/non-conformity/:id"
            element={
              <ProtectedRoute resource="non_conformities" action="create">
                <AppLayout>
                  <NonConformityEditor />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/improvement"
            element={
              <AppLayout>
                <ContinuousImprovementPage />
              </AppLayout>
            }
          />
          <Route
            path="/improvement/new"
            element={
              <AppLayout>
                <ContinuousImprovementEditor />
              </AppLayout>
            }
          />
          <Route
            path="/improvement/:id"
            element={
              <AppLayout>
                <ContinuousImprovementEditor />
              </AppLayout>
            }
          />
          <Route
            path="/documents"
            element={
              <AppLayout>
                <DocumentControlPage />
              </AppLayout>
            }
          />
          <Route
            path="/documents/new"
            element={
              <AppLayout>
                <DocumentControlEditor />
              </AppLayout>
            }
          />
          <Route
            path="/documents/:id"
            element={
              <AppLayout>
                <DocumentControlEditor />
              </AppLayout>
            }
          />
          <Route
            path="/security-check"
            element={
              <AppLayout>
                <SecurityCheckPage />
              </AppLayout>
            }
          />
          <Route
            path="/setup-rbac"
            element={
              <ProtectedRoute requiredRoles={["SUPER_ADMIN", "ORG_ADMIN"]}>
                <AppLayout>
                  <SetupRBACSimplePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analyze-rbac"
            element={
              <AppLayout>
                <AnalyzeExistingRolesPage />
              </AppLayout>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredRoles={["SUPER_ADMIN", "ORG_ADMIN"]}>
                <AppLayout>
                  <UserManagementPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/final-security-audit"
            element={
              <ProtectedRoute requiredRoles={["SUPER_ADMIN", "ORG_ADMIN"]}>
                <AppLayout>
                  <FinalSecurityAuditPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

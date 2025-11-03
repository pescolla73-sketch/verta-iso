import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
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
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
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
              <AppLayout>
                <RiskAssessment />
              </AppLayout>
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
              <AppLayout>
                <PolicyManagementPage />
              </AppLayout>
            }
          />
          <Route
            path="/policies/:id"
            element={
              <AppLayout>
                <PolicyView />
              </AppLayout>
            }
          />
          <Route
            path="/policy-editor"
            element={
              <AppLayout>
                <PolicyEditor />
              </AppLayout>
            }
          />
          <Route
            path="/policy-editor/:id"
            element={
              <AppLayout>
                <PolicyEditor />
              </AppLayout>
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
              <AppLayout>
                <SetupAzienda />
              </AppLayout>
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
              <AppLayout>
                <ManagementReview />
              </AppLayout>
            }
          />
          <Route
            path="/management-review/:id/edit"
            element={
              <AppLayout>
                <ManagementReviewEditor />
              </AppLayout>
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

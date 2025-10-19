import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Controls from "./pages/Controls";
import ControlDetail from "./pages/ControlDetail";
import SoA from "./pages/SoA";
import Audits from "./pages/Audits";
import Policies from "./pages/Policies";
import PolicyGenerator from "./pages/PolicyGenerator";
import Roles from "./pages/Roles";
import NotFound from "./pages/NotFound";

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
            path="/controls"
            element={
              <AppLayout>
                <Controls />
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
            path="/policies"
            element={
              <AppLayout>
                <Policies />
              </AppLayout>
            }
          />
          <Route
            path="/policies/generate"
            element={
              <AppLayout>
                <PolicyGenerator />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

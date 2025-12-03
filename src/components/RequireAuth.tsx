import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        Caricamento...
      </div>
    );
  }

  // DEMO mode: se non c'è utente, lascia passare
  // PRODUZIONE: se non c'è utente, redirect a login
  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }

  return <>{children}</>;
}

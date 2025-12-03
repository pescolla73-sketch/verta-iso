import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SetupPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    checkUser();
  }, []);

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La password deve essere di almeno 8 caratteri");
      return;
    }

    if (password !== confirmPassword) {
      setError("Le password non corrispondono");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("organization_users")
          .update({
            is_active: true,
            activated_at: new Date().toISOString(),
          })
          .eq("auth_user_id", user.id);
      }

      toast({
        title: "Password Impostata!",
        description: "Ora puoi accedere al sistema",
      });

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      console.error("Setup password error:", error);
      setError(error.message || "Errore durante l'impostazione della password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Imposta la tua Password
          </CardTitle>
          <CardDescription>
            {email ? `Benvenuto! Configura la password per ${email}` : "Benvenuto nel sistema ISMS"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSetupPassword} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Nuova Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Almeno 8 caratteri"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Conferma Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ripeti la password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 text-blue-800">
                  <p className="font-medium">Requisiti password:</p>
                  <ul className="text-xs space-y-1 ml-4 list-disc">
                    <li>Minimo 8 caratteri</li>
                    <li>Combinazione di lettere e numeri consigliata</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Impostazione in corso..." : "Imposta Password e Accedi"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

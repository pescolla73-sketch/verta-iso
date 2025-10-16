import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users as UsersIcon, Shield, Eye } from "lucide-react";

export default function Roles() {
  const roles = [
    {
      id: 1,
      name: "Amministratore",
      icon: Shield,
      users: 2,
      permissions: [
        "Gestione completa",
        "Modifica controlli",
        "Gestione utenti",
        "Generazione report",
      ],
      color: "text-destructive",
    },
    {
      id: 2,
      name: "Auditor",
      icon: Eye,
      users: 5,
      permissions: [
        "Visualizzazione completa",
        "Commenti su controlli",
        "Creazione audit",
        "Generazione report",
      ],
      color: "text-primary",
    },
    {
      id: 3,
      name: "Visualizzatore",
      icon: UsersIcon,
      users: 15,
      permissions: [
        "Visualizzazione dashboard",
        "Visualizzazione controlli",
        "Visualizzazione asset",
      ],
      color: "text-muted-foreground",
    },
  ];

  const mockUsers = [
    {
      id: 1,
      name: "Marco Rossi",
      email: "marco.rossi@company.it",
      role: "Amministratore",
      lastAccess: "Oggi, 14:30",
    },
    {
      id: 2,
      name: "Laura Bianchi",
      email: "laura.bianchi@company.it",
      role: "Auditor",
      lastAccess: "Oggi, 12:15",
    },
    {
      id: 3,
      name: "Giuseppe Verdi",
      email: "giuseppe.verdi@company.it",
      role: "Auditor",
      lastAccess: "Ieri, 16:45",
    },
    {
      id: 4,
      name: "Maria Ferrari",
      email: "maria.ferrari@company.it",
      role: "Visualizzatore",
      lastAccess: "2 giorni fa",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Gestione Ruoli e Utenti</h1>
          <p className="text-muted-foreground mt-2">
            Configura permessi e accessi al sistema
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuovo Utente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className="shadow-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center ${role.color}`}
                >
                  <role.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {role.users} utenti
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground mb-3">
                  Permessi:
                </p>
                {role.permissions.map((permission, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {permission}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Utenti del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge variant="outline">{user.role}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ultimo accesso: {user.lastAccess}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

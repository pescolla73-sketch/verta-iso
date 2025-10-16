import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger";
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  const variantStyles = {
    default: "bg-primary/5 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  };

  return (
    <Card className="shadow-card transition-smooth hover:shadow-elevated">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2 text-foreground">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-xs mt-2 font-medium",
                  trend.positive ? "text-success" : "text-destructive"
                )}
              >
                {trend.value}
              </p>
            )}
          </div>
          <div
            className={cn(
              "h-12 w-12 rounded-lg flex items-center justify-center",
              variantStyles[variant]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

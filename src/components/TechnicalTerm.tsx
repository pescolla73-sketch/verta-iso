import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface TechnicalTermProps {
  term: string;
  definition: string;
  isoClause?: string;
}

export function TechnicalTerm({ term, definition, isoClause }: TechnicalTermProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help border-b border-dashed border-muted-foreground/50">
            {term}
            <HelpCircle className="h-3 w-3 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            Termine tecnico ISO 27001
          </p>
          <p className="text-sm">{definition}</p>
          {isoClause && (
            <p className="text-xs text-muted-foreground mt-2">
              📋 Clausola {isoClause}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

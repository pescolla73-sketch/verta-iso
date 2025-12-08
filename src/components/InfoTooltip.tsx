import { useState } from 'react';
import { Info, HelpCircle, BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface InfoTooltipProps {
  title: string;
  description: string;
  extendedHelp?: string;
  examples?: string[];
  relatedLinks?: { label: string; path: string }[];
  type?: 'info' | 'help' | 'guide';
  variant?: 'icon' | 'inline' | 'badge';
}

export function InfoTooltip({
  title,
  description,
  extendedHelp,
  examples,
  relatedLinks,
  type = 'info',
  variant = 'icon'
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  const getIcon = () => {
    switch (type) {
      case 'help': return <HelpCircle className="h-4 w-4 text-blue-500" />;
      case 'guide': return <BookOpen className="h-4 w-4 text-purple-500" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const hasExtendedContent = extendedHelp || examples || relatedLinks;

  const tooltipTrigger = () => {
    switch (variant) {
      case 'inline':
        return (
          <span className="inline-flex items-center gap-1 text-primary hover:text-primary/80 cursor-help underline decoration-dotted">
            {title}
            {getIcon()}
          </span>
        );
      case 'badge':
        return (
          <Badge variant="outline" className="cursor-help hover:bg-accent">
            <Info className="h-3 w-3 mr-1" />
            {title}
          </Badge>
        );
      default:
        return (
          <button 
            type="button"
            className="inline-flex items-center justify-center hover:bg-accent rounded-full p-1 transition-colors"
          >
            {getIcon()}
          </button>
        );
    }
  };

  // If no extended content, just show tooltip
  if (!hasExtendedContent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {tooltipTrigger()}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm">{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              {tooltipTrigger()}
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getIcon()}
                  {title}
                </DialogTitle>
                <DialogDescription className="text-base mt-2">
                  {description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {extendedHelp && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      📘 Spiegazione Dettagliata
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-line">
                      {extendedHelp}
                    </p>
                  </div>
                )}

                {examples && examples.length > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      💡 Esempi Pratici
                    </h4>
                    <ul className="space-y-2">
                      {examples.map((example, index) => (
                        <li key={index} className="text-sm text-green-800 dark:text-green-200 flex items-start gap-2">
                          <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {relatedLinks && relatedLinks.length > 0 && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                      🔗 Risorse Correlate
                    </h4>
                    <div className="space-y-2">
                      {relatedLinks.map((link, index) => (
                        <Button
                          key={index}
                          variant="link"
                          className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 p-0 h-auto"
                          onClick={() => {
                            setOpen(false);
                            window.location.href = link.path;
                          }}
                        >
                          → {link.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{description}</p>
          {hasExtendedContent && (
            <p className="text-xs text-muted-foreground mt-1">Clicca per dettagli</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

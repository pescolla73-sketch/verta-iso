import * as React from "react";
import { Check, ChevronsUpDown, Lightbulb, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AutoComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function AutoCombobox({
  value,
  onValueChange,
  suggestions,
  placeholder = "Seleziona o digita...",
  emptyText = "Nessun suggerimento",
  className,
  disabled,
}: AutoComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value || "");

  // Update inputValue when external value changes
  React.useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Filter suggestions based on input
  const filteredSuggestions = React.useMemo(() => {
    if (!inputValue) return suggestions;
    return suggestions.filter((s) =>
      s.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [inputValue, suggestions]);

  // Check if the current input is already in suggestions
  const isNewValue = inputValue.trim() !== "" && 
    !suggestions.some((s) => s.toLowerCase() === inputValue.toLowerCase().trim());

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setInputValue(selectedValue);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    // Don't call onValueChange here - only on explicit selection or blur
  };

  const handleInputBlur = () => {
    // Commit the typed value when blurring
    if (inputValue.trim() !== "") {
      onValueChange(inputValue.trim());
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
          disabled={disabled}
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {suggestions.length > 0 && (
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={inputValue}
            onValueChange={handleInputChange}
            onBlur={handleInputBlur}
          />
          <CommandList>
            {filteredSuggestions.length === 0 && !isNewValue && (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            
            {/* Option to add new value */}
            {isNewValue && (
              <CommandGroup heading="Nuovo valore">
                <CommandItem
                  value={inputValue}
                  onSelect={() => handleSelect(inputValue.trim())}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Aggiungi "{inputValue.trim()}"
                </CommandItem>
              </CommandGroup>
            )}
            
            {/* Existing suggestions */}
            {filteredSuggestions.length > 0 && (
              <CommandGroup heading="Suggerimenti">
                {filteredSuggestions.slice(0, 10).map((suggestion) => (
                  <CommandItem
                    key={suggestion}
                    value={suggestion}
                    onSelect={() => handleSelect(suggestion)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === suggestion ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Lightbulb className="mr-2 h-3.5 w-3.5 text-amber-500" />
                    {suggestion}
                  </CommandItem>
                ))}</CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


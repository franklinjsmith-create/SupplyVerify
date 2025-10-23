import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TextInputZoneProps {
  onTextSubmit: (text: string) => void;
  disabled?: boolean;
}

export function TextInputZone({ onTextSubmit, disabled }: TextInputZoneProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim()) {
      onTextSubmit(text);
    }
  };

  const placeholder = `Example:
Example Botanicals LLC | 1234567890 | ginger, turmeric, black pepper
Organic Farms Co | 0987654321 | wheat, barley, oats`;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between"
          disabled={disabled}
          data-testid="button-text-input-toggle"
        >
          <span className="text-sm font-medium">
            Or paste text data (pipe-delimited format)
          </span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4 mt-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-32 font-mono text-sm resize-none focus-visible:ring-primary"
          data-testid="textarea-text-input"
        />
        
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={disabled || !text.trim()}
            data-testid="button-text-submit"
          >
            Process Text Data
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

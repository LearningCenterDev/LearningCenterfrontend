import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Table2 } from "lucide-react";

export type ViewMode = "grid" | "list" | "table";

interface ViewModeToggleProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  availableModes?: ViewMode[];
  className?: string;
}

export function ViewModeToggle({ 
  currentMode, 
  onModeChange, 
  availableModes = ["grid", "list", "table"],
  className = ""
}: ViewModeToggleProps) {
  const modeConfig = {
    grid: {
      icon: LayoutGrid,
      label: "Grid view"
    },
    list: {
      icon: List,
      label: "List view"
    },
    table: {
      icon: Table2,
      label: "Table view"
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} data-testid="view-mode-toggle">
      {availableModes.map((mode) => {
        const Icon = modeConfig[mode].icon;
        return (
          <Button
            key={mode}
            variant={currentMode === mode ? "default" : "outline"}
            size="icon"
            onClick={() => onModeChange(mode)}
            title={modeConfig[mode].label}
            data-testid={`button-view-${mode}`}
          >
            <Icon className="w-4 h-4" />
          </Button>
        );
      })}
    </div>
  );
}

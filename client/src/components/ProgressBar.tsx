import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: "default" | "success" | "warning" | "destructive";
  className?: string;
}

const variantStyles = {
  default: "bg-primary",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  destructive: "bg-red-500",
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  variant = "default",
  className
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div className={cn("space-y-2", className)} data-testid="progress-bar">
      {label && (
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">{label}</span>
          {showPercentage && <span className="text-muted-foreground">{percentage}%</span>}
        </div>
      )}
      <Progress 
        value={percentage} 
        className={cn("h-2", variantStyles[variant])} 
      />
    </div>
  );
}

export default ProgressBar;
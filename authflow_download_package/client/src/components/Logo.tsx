import { Shield } from "lucide-react";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
        <Shield className="w-6 h-6 text-primary-foreground" />
      </div>
      {showText && (
        <span className="text-2xl font-bold text-foreground">Authflow</span>
      )}
    </div>
  );
}

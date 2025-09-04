import { CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessAnimationProps {
  isVisible: boolean;
  message: string;
  onClose?: () => void;
}

export function SuccessAnimation({ isVisible, message, onClose }: SuccessAnimationProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-background border rounded-lg p-8 shadow-lg animate-scale-in max-w-md mx-4">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <CheckCircle className="w-16 h-16 text-success animate-bounce" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Sucesso!</h3>
          <p className="text-sm text-muted-foreground mb-6">{message}</p>
          {onClose && (
            <Button onClick={onClose} size="sm">
              Fechar
            </Button>
          )}
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
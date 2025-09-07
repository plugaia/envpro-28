import { Button } from "@/components/ui/button";
import { ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  children: React.ReactNode;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading = false, children, disabled, ...props }, ref) => {
    return (
      <Button {...props} disabled={loading || disabled} ref={ref}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";
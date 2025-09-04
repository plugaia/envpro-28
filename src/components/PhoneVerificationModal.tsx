import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Shield } from "lucide-react";

interface PhoneVerificationModalProps {
  isOpen: boolean;
  clientPhone: string;
  onVerify: (digits: string) => void;
  onClose: () => void;
  error?: string;
}

export function PhoneVerificationModal({ 
  isOpen, 
  clientPhone, 
  onVerify, 
  onClose, 
  error 
}: PhoneVerificationModalProps) {
  const [digits, setDigits] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (digits.length === 4) {
      onVerify(digits);
    }
  };

  const maskedPhone = clientPhone ? 
    `****-****-${clientPhone.slice(-4)}` : 
    "****-****-XXXX";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Verificação de Segurança
          </DialogTitle>
          <DialogDescription>
            Para acessar sua proposta, digite os últimos 4 dígitos do seu telefone cadastrado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-center">
            <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Telefone cadastrado: <span className="font-mono">{maskedPhone}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="phone-digits" className="text-sm font-medium">
                Últimos 4 dígitos
              </label>
              <Input
                id="phone-digits"
                type="text"
                placeholder="0000"
                maxLength={4}
                value={digits}
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))}
                className="text-center text-lg font-mono"
                autoFocus
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={digits.length !== 4}
                className="flex-1"
              >
                Verificar
              </Button>
            </div>
          </form>

          <div className="text-xs text-muted-foreground text-center">
            <p>Esta verificação garante que apenas você pode acessar sua proposta</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
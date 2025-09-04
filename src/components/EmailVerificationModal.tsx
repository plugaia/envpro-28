import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle } from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export const EmailVerificationModal = ({ isOpen, onClose, email }: EmailVerificationModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Mail className="h-16 w-16 text-primary" />
              <CheckCircle className="h-6 w-6 text-green-500 absolute -top-1 -right-1 bg-background rounded-full" />
            </div>
          </div>
          <DialogTitle className="text-xl">Verifique seu Email</DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <p>
              Enviamos um link de verificação para:
            </p>
            <p className="font-semibold text-foreground">{email}</p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <h4 className="font-medium text-foreground mb-2">Próximos passos:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>1. Abra seu email</li>
              <li>2. Clique no link de verificação</li>
              <li>3. Faça login na plataforma</li>
            </ul>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-4">
              Não recebeu o email? Verifique sua caixa de spam ou lixo eletrônico.
            </p>
            
            <Button onClick={onClose} className="w-full">
              Entendi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
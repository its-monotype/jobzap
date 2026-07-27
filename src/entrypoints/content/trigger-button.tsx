import { Logo } from '@/components/icons/logo';
import { X } from 'lucide-react';

interface TriggerButtonProps {
  open?: boolean;
  onClick?: () => void;
}

export function TriggerButton({ open, onClick }: TriggerButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/80"
      onClick={onClick}
      aria-label={open ? 'Close JobZap' : 'Open JobZap'}
      aria-expanded={open}
    >
      {open ? <X className="size-6" /> : <Logo className="size-6" />}
    </button>
  );
}

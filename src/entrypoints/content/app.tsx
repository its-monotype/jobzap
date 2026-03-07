import '@/assets/tailwind.css';
import { Logo } from '@/components/icons/logo';

export function App() {
  return (
    <div className="fixed top-16 right-4 flex flex-col items-end gap-2">
      <button
        type="button"
        className="inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/80"
      >
        <Logo className="size-6" />
      </button>
    </div>
  );
}

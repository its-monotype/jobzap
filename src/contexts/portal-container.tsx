import { createContext, use } from 'react';

const PortalContainerContext = createContext<HTMLElement | null>(null);

export function PortalContainerProvider({
  container,
  children,
}: {
  container: HTMLElement | null;
  children: React.ReactNode;
}) {
  return (
    <PortalContainerContext value={container}>
      {children}
    </PortalContainerContext>
  );
}

export function usePortalContainer() {
  return use(PortalContainerContext);
}

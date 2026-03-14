import * as React from 'react';

const PortalContainerContext = React.createContext<HTMLElement | null>(null);

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
  return React.useContext(PortalContainerContext);
}

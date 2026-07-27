import { browser } from '#imports';
import { useEffect, useState } from 'react';
import { FilterPills } from './filter-pills';
import { Panel } from './panel';
import { TriggerButton } from './trigger-button';

export function App() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleRuntimeMessage = (message: Record<string, unknown>) => {
      if (message.type === 'TOGGLE_PANEL') {
        setOpen((current) => !current);
      }
    };

    browser.runtime.onMessage.addListener(handleRuntimeMessage);
    return () => browser.runtime.onMessage.removeListener(handleRuntimeMessage);
  }, []);

  return (
    <div className="fixed top-16 right-4 flex flex-col items-end gap-3">
      <TriggerButton
        open={open}
        onClick={() => setOpen((current) => !current)}
      />
      {open ? <Panel /> : <FilterPills />}
    </div>
  );
}

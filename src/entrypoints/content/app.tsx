import { useState } from 'react';
import { FilterPills } from './filter-pills';
import { Panel } from './panel';
import { TriggerButton } from './trigger-button';

export function App() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-16 right-4 flex flex-col items-end gap-3">
      <TriggerButton open={open} onClick={() => setOpen((o) => !o)} />
      {open ? <Panel /> : <FilterPills />}
    </div>
  );
}

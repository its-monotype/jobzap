import { useActions, usePanelOpen } from '@/store';
import { FilterPills } from './filter-pills';
import { Panel } from './panel';
import { TriggerButton } from './trigger-button';

export function App() {
  const open = usePanelOpen();
  const { togglePanelOpen } = useActions();

  return (
    <div className="fixed top-16 right-4 flex flex-col items-end gap-3">
      <TriggerButton open={open} onClick={togglePanelOpen} />
      {open ? <Panel /> : <FilterPills />}
    </div>
  );
}

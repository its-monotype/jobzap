// import { useEffect, useState } from 'react';
// import {
//   DEFAULT_SETTINGS,
//   getSettings,
//   saveSettings,
//   type Settings,
// } from '../../lib/settings';

// async function applyToActiveTab() {
//   const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
//   if (!tab?.id) return;
//   await browser.tabs.sendMessage(tab.id, { type: 'LJF_APPLY' }).catch(() => {});
// }

// function Row(props: { label: string; children: React.ReactNode }) {
//   return (
//     <div
//       style={{
//         display: 'flex',
//         justifyContent: 'space-between',
//         gap: 12,
//         padding: '6px 0',
//       }}
//     >
//       <span>{props.label}</span>
//       {props.children}
//     </div>
//   );
// }

export default function App() {
  // const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);

  // useEffect(() => {
  //   void (async () => setS(await getSettings()))();
  // }, []);

  // const update = async (patch: Partial<Settings>) => {
  //   const next = { ...s, ...patch };
  //   setS(next);
  //   await saveSettings(patch);
  //   await applyToActiveTab();
  // };

  return (
    <div style={{ width: 340, padding: 12 }}>
      {/* <h3 style={{ margin: '0 0 8px' }}>Real Jobs</h3>

      <Row label="Enabled">
        <input
          type="checkbox"
          checked={s.enabled}
          onChange={(e) => update({ enabled: e.target.checked })}
        />
      </Row> */}

      {/* <Row label="Hide Promoted">
        <input
          type="checkbox"
          checked={s.hidePromoted}
          onChange={(e) => update({ hidePromoted: e.target.checked })}
          disabled={!s.enabled}
        />
      </Row>

      <Row label="Hide Reposted">
        <input
          type="checkbox"
          checked={s.hideReposted}
          onChange={(e) => update({ hideReposted: e.target.checked })}
          disabled={!s.enabled}
        />
      </Row>

      <hr />

      <Row label="Location mode">
        <select
          value={s.locationMode}
          onChange={(e) => update({ locationMode: e.target.value as any })}
          disabled={!s.enabled}
        >
          <option value="off">Off</option>
          <option value="allow">Allow only</option>
          <option value="deny">Hide these</option>
        </select>
      </Row>

      <textarea
        value={s.locations}
        onChange={(e) => update({ locations: e.target.value })}
        placeholder={'Berlin\nHamburg\nRemote'}
        style={{ width: '100%', height: 80, marginTop: 8 }}
        disabled={!s.enabled || s.locationMode === 'off'}
      /> */}
      {/* 
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button onClick={() => applyToActiveTab()}>Re-apply</button>
      </div> */}

      <p className="text-sm text-muted-foreground mt-2">
        Open LinkedIn Jobs and keep scrolling; filters re-apply automatically.
      </p>
    </div>
  );
}

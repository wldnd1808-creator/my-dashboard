import React, { useState } from 'react';
import { Iccu3DView } from './Iccu3DView';

export function App() {
  const [isExploded, setIsExploded] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', margin: 0 }}>
      <header style={{ padding: '12px 16px', background: '#1a1a1a', color: '#eee', display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: '1.1rem' }}>ICCU 조립 뷰</h1>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isExploded}
            onChange={(e) => setIsExploded(e.target.checked)}
          />
          <span>분해 뷰 (Exploded View)</span>
        </label>
      </header>
      <main style={{ flex: 1, minHeight: 0 }}>
        <Iccu3DView isExploded={isExploded} />
      </main>
    </div>
  );
}

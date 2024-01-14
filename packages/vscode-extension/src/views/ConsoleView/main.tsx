import { createRoot } from 'react-dom/client';
import React, { useState } from 'react';

declare var acquireVsCodeApi: () => {
  postMessage(message: any): void;
};
let vscode = acquireVsCodeApi();

type Log = {
  level: 'info' | 'warn' | 'error';
  text: string;
  source: string;
  args: any[];
  timestamp: number;
}

function App() {
  const [logs, setLogs] = useState<Log[]>([]);

  React.useEffect(() => {
    vscode.postMessage({ command: 'ready' });
    function onMessage(event: MessageEvent) {
      const log = event.data;
      setLogs(logs => [...logs, log]);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);
  return <div style={{
    width: '100%',
    height: '100%',
    overflow: 'auto',
    padding: '10px',
  }}>
    <ul style={{
      listStyle: 'none',
      padding: '5px 30px',
      margin: 0,
      fontFamily: 'monospace',
      fontSize: '12px',
      lineHeight: '1.5em',
    }}>
      {logs.map(log => <li key={log.timestamp} className={log.level}>
        <span className="text">{log.text}</span>
      </li>)}
    </ul>
  </div>;
}

const root = document.getElementById('app');
if (root) {
  createRoot(root).render(
    <App />
  );
}

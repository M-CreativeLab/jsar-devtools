import { createRoot } from 'react-dom/client';
import React, { useState } from 'react';
import './console.css';

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
      const data = event.data || {};
      if (data.command === 'logEntryAdded') {
        setLogs(logs => [...logs, data.args[0]]);
      } else if (data.command === 'clear') {
        setLogs([]);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);
  return <div id="app">
    <ul id="logs">
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

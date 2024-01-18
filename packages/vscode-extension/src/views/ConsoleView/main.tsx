import { createRoot } from 'react-dom/client';
import React, { useState } from 'react';
import Console from './Console';
import './main.css';
import { Message } from './definitions/component';

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

function argToValue(arg) {
  if (!arg) {
    return null;
  }
  if (
    arg.type === 'number' ||
    arg.type === 'string' ||
    arg.type === 'boolean'
  ) {
    return arg.value;
  }
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

  const messages: Message[] = logs.map((log, i) => {
    return {
      id: `${log.timestamp}-${i}`,
      method: log.level,
      data: [log.text].concat(argToValue(log.args)),
    } as Message;
  });
  return <div id="app">
    <Console logs={messages} />
  </div>;
}

const root = document.getElementById('app');
if (root) {
  createRoot(root).render(
    <App />
  );
}

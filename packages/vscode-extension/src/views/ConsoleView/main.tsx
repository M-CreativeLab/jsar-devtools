import { createRoot } from 'react-dom/client';
import React, { useState, useEffect } from 'react';

function App() {
  // const vscodeThemeKind = document.body.getAttribute('data-vscode-theme-kind');
  return <div>
    <p>TODO</p>
  </div>;
}

const root = document.getElementById('app');
if (root) {
  createRoot(root).render(
    <App />
  );
}

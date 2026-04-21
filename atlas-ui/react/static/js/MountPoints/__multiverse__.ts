// atlas-ui/react/static/js/MountPoints/__multiverse__.ts
import React from 'react';
import { createRoot } from 'react-dom/client';
import MultiverseLayout from '../Layouts/__multiverse__.tsx';

document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('atlas-react-root');
  if (!rootElement) {
    return;
  }

  const root = createRoot(rootElement);
  root.render(React.createElement(MultiverseLayout, {}));
});
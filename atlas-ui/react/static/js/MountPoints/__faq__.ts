// atlas-ui/react/static/js/MountPoints/__faq__.ts
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import FaqLayout from '../Layouts/__faq__.tsx';

interface FaqData {
  version: string;
  versionHash: string;
}

const versionMeta = document.querySelector('meta[name="atlas-version"]');
const versionHashMeta = document.querySelector('meta[name="atlas-version-hash"]');

const faqData: FaqData = {
  version: versionMeta ? versionMeta.getAttribute('content') || '1.0.0' : '1.0.0',
  versionHash: versionHashMeta ? versionHashMeta.getAttribute('content') || '' : ''
};

const container = document.getElementById('atlas-react-root');

if (container) {
  const root = createRoot(container);
  root.render(createElement(FaqLayout, faqData));
}
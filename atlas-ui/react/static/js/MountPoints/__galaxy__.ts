// atlas-ui/react/static/js/MountPoints/__galaxy__.ts
import React from 'react';
import { createRoot } from 'react-dom/client';
import GalaxyLayout from '../Layouts/__galaxy__.tsx';


document.addEventListener('DOMContentLoaded', () => {
  
  const rootElement = document.getElementById('atlas-react-root');
  if (!rootElement) {
    return;
  }

  const getDataFromScript = (id: string) => {
    const script = document.getElementById(id);
    if (!script || !script.textContent) return null;
    
    try {
      return JSON.parse(script.textContent.trim());
    } catch (error) {
      return null;
    }
  };

  try {
    const galaxyData = getDataFromScript('data-galaxy') || {};
    const systemsData = getDataFromScript('data-systems') || [];
    const navigationData = getDataFromScript('data-navigation') || {};
    const commonData = getDataFromScript('data-common') || {};

    const props = {
      galaxy: {
        name: galaxyData.name || 'Unknown Galaxy',
        coordinates: galaxyData.coordinates || [0, 0, 0],
        galaxy_type: galaxyData.galaxy_type || 'Unknown',
        num_systems: galaxyData.num_systems || 0,
        black_holes: galaxyData.black_holes || 0,
        pulsars: galaxyData.pulsars || 0,
        quasars: galaxyData.quasars || 0,
        seed: galaxyData.seed || 12345
      },
      systems: systemsData,
      galaxy_url: navigationData.galaxy_url || '#',
      version: commonData.version || '1.0.0',
      page: navigationData.page || 1,
      prev_page: navigationData.prev_page,
      next_page: navigationData.next_page,
      finish: navigationData.finish || 1,
      image_url: commonData.image_url || ''
    };


    const root = createRoot(rootElement);
    root.render(React.createElement(GalaxyLayout, props));
    
  } catch (error) {
    const fallbackProps = {
      galaxy: {
        name: 'Unknown Galaxy',
        coordinates: [0, 0, 0],
        galaxy_type: 'Unknown',
        num_systems: 0,
        black_holes: 0,
        pulsars: 0,
        quasars: 0,
        seed: 12345
      },
      systems: [],
      galaxy_url: '#',
      version: '1.0.0',
      page: 1,
      finish: 1,
      image_url: ''
    };

    const root = createRoot(rootElement);
    root.render(React.createElement(GalaxyLayout, fallbackProps));
  }
});
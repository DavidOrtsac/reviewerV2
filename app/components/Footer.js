// Footer.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';

function Footer({ isGenerating, darkMode, loaded }) {
  if (isGenerating) return null;

  return (
    <footer className={`fixed bottom-0 left-0 right-0 z-30 ${darkMode ? 'bg-black text-white' : 'bg-white text-gray-500'} text-center text-sm p-4`}>
      &copy; {new Date().getFullYear()} David Castro. All rights reserved.
      <br />
      <a href="https://calver.org" target="_blank" rel="noopener noreferrer">Release 2024.10.25</a>
      <br />
      <a href="https://discord.gg/5rDWAzWunK" target="_blank" rel="noopener noreferrer" className="discord-button" style={{ visibility: loaded ? 'visible' : 'hidden' }}>
        <FontAwesomeIcon icon={faDiscord} /> Discord
      </a>
    </footer>
  );
}

export default Footer;

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

function Header({ toggleSidebar, toggleDarkMode, darkMode }) {
  return (
    <header className="flex justify-between items-center mb-4">
      <button onClick={toggleSidebar} className="p-2 rounded-full bg-gray-200 text-black dark:bg-gray-800 dark:text-white">
        <FontAwesomeIcon icon={faBars} />
      </button>
      <button onClick={toggleDarkMode} className="p-2 rounded-full bg-gray-200 text-black dark:bg-gray-800 dark:text-white">
        <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
      </button>
    </header>
  );
}

export default Header;
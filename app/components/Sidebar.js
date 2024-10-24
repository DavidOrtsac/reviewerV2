// Sidebar.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';

function Sidebar({ showSidebar, toggleSidebar, savedQuizzes, loadSavedQuiz, deleteSavedQuiz, darkMode }) {
  if (!showSidebar) return null;

  return (
    <div className={`fixed top-0 left-0 h-full w-64 bg-gray-100 shadow-lg z-50 overflow-auto ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">Saved Quizzes</h2>
        <button onClick={toggleSidebar} className="text-lg">
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      {savedQuizzes.length === 0 ? (
        <p className="p-4">No saved quizzes.</p>
      ) : (
        <ul>
          {savedQuizzes.map(quiz => (
            <li key={quiz.id} className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold">{quiz.title}</h3>
                <p className="text-sm">{quiz.timestamp}</p>
              </div>
              <div className="flex items-center">
                <button onClick={() => loadSavedQuiz(quiz.id)} className="px-2 py-1 bg-blue-500 text-white rounded mr-2">
                  Load
                </button>
                <button onClick={() => deleteSavedQuiz(quiz.id)} className="px-2 py-1 bg-red-500 text-white rounded">
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Sidebar;

// FixedInputArea.js

import React from 'react';

function FixedInputArea({ state, toggleInputArea, handleChatSubmit, handleCancel, darkMode }) {
  if (!state.isGenerating && state.quizQuestions.length === 0) return null;

  return (
    <div>
      <div className={`fixed bottom-4 left-4 right-4 bg-white shadow-lg rounded-lg p-4 flex justify-between items-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {state.isInputExpanded && (
          <>
            <input
              type="text"
              className={`w-full p-4 text-lg border-2 border-gray-300 rounded-lg mr-4 ${darkMode ? 'text-white bg-gray-700' : 'text-black bg-white'}`}
              placeholder="Type your message..."
              value={state.userPrompt}
              onChange={e => state.setUserPrompt(e.target.value)}
              disabled={state.isGenerating}
            />
            <button
              type="button"
              onClick={handleChatSubmit}
              className={`ml-4 px-6 py-2 rounded-md transition duration-200 ${state.isButtonDisabled ? 'bg-gray-400 text-white' : 'bg-black text-white hover:bg-gray-700'}`}
              disabled={state.isButtonDisabled || !state.userPrompt.trim()}
            >
              {state.buttonText}
            </button>
            {state.isGenerating && (
              <button
                type="button"
                onClick={handleCancel}
                className="ml-4 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
              >
                Cancel
              </button>
            )}
          </>
        )}
        <div className="input-toggle-button cursor-pointer" onClick={toggleInputArea}>
          {state.isInputExpanded ? '▲' : '▼'}
        </div>
      </div>
    </div>
  );
}

export default FixedInputArea;

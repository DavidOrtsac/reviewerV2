// InitialUI.js

import React from 'react';
import PDFUploadForm from './PDFUploadForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faCog, faPlay, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';

function InitialUI({
  state,
  handlePDFText,
  handleChatSubmit,
  handleExampleText,
  toggleOptionsVisibility,
  togglePromptType,
  handleQuizModeChange,
  darkMode,
}) {
  return (
    <div>
      <div className="text-center mb-8">
        <div style={{ fontFamily: 'Playfair Display, serif' }} className="font-sans text-4xl text-center mt-1 main-title">
          The<span className="text-red-600">SelfReview</span>Engine
        </div>
        <h2 className={`responsive-header mb-10 ${darkMode ? 'text-white' : 'text-black'}`}>
          Test your knowledge - Self-review by turning your study notes into quizzes
        </h2>
      </div>
      <div className="flex justify-center items-center mb-8">
        {/* Quiz Mode Dropdown - Hidden on mobile */}
        <div className="flex items-center mr-4 hidden sm:flex">
          <label htmlFor="quiz-mode-dropdown" className={`block text-lg font-medium ${darkMode ? 'text-white' : 'text-black'} mr-2`}>
            Select Mode:
          </label>
          <select
            id="quiz-mode-dropdown"
            value={state.quizMode}
            onChange={handleQuizModeChange}
            className="p-2 rounded border border-gray-400 text-lg bg-white dark:bg-gray-800 dark:border-gray-600"
            style={{ height: '40px' }}
          >
            <option value="general" title="Generate general knowledge quizzes based on any topic.">General</option>
            <option value="math" disabled title="Coming Soon: Generate math-based quizzes!">Math (Coming Soon)</option>
          </select>
        </div>

        {/* PDF Upload Form */}
        <div className="ml-2">
          <div style={{ transform: 'translateY(6px)' }}>
            <PDFUploadForm onPDFParse={handlePDFText} />
          </div>
        </div>
      </div>

      <div className="mb-20">
        <form onSubmit={handleChatSubmit} className="space-y-4">
          <textarea
            className={`textarea w-full p-4 border-2 border-gray-300 rounded-lg resize-y overflow-auto flex-grow user-input ${darkMode ? 'text-white bg-black' : 'text-black bg-white'}`}
            placeholder="Or manually paste your story/essay/report here..."
            value={state.userPrompt}
            onChange={e => state.setUserPrompt(e.target.value)}
            rows="6"
            maxLength="40000"
          />
          <div className="flex justify-between items-center">
            <span className={`text-sm text-gray-600 counter ${darkMode ? 'text-white bg-black' : 'text-black bg-white'}`}>{state.userPrompt.length}/40000</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExampleText}
                style={{ visibility: state.loaded ? 'visible' : 'hidden' }}
                className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 transition duration-200"
                disabled={state.isGenerating}
              >
                <FontAwesomeIcon icon={faLightbulb} style={{ marginRight: '4px' }} /> Example
              </button>
              <button
                type="button"
                onClick={toggleOptionsVisibility}
                style={{ visibility: state.loaded ? 'visible' : 'hidden' }}
                className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 transition duration-200"
              >
                <FontAwesomeIcon icon={faCog} style={{ marginRight: '4px' }} /> {state.showOptions ? 'Hide Options' : 'Show Options'}
              </button>
              <button
                type="submit"
                style={{ visibility: state.loaded ? 'visible' : 'hidden' }}
                className={`px-6 py-2 rounded-md transition duration-200 ${state.isGenerating || !state.userPrompt.trim() ? 'bg-gray-400 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}
                disabled={state.isGenerating || !state.userPrompt.trim()}
              >
                <FontAwesomeIcon icon={faPlay} style={{ marginRight: '4px' }} /> Generate
              </button>
            </div>
          </div>
          <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Files uploaded will not be stored</p>
          {state.showOptions && (
            <div className="mt-4">
              <div className="text-center">
                <label htmlFor="multiple-choice-slider" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                  Number of Multiple Choice Questions
                </label>
                <input
                  id="multiple-choice-slider"
                  type="range"
                  min="3"
                  max="10"
                  value={state.MultipleChoiceQuestionCount}
                  onChange={e => state.setMultipleChoiceQuestionCount(e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className={`text-sm text-gray-600 mt-2 ${darkMode ? 'text-white' : 'text-black'}`}>{state.MultipleChoiceQuestionCount}</div>
              </div>
              <div className="text-center mt-4">
                <label htmlFor="true-false-slider" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                  Number of True/False Questions
                </label>
                <input
                  id="true-false-slider"
                  type="range"
                  min="1"
                  max="10"
                  value={state.TrueFalseQuestionCount}
                  onChange={e => state.setTrueFalseQuestionCount(e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className={`text-sm text-gray-600 mt-2 ${darkMode ? 'text-white' : 'text-black'}`}>{state.TrueFalseQuestionCount}</div>
              </div>
              <div className="text-center mt-4">
                <label htmlFor="prompt-type-switch" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                  Quiz Prompt Type
                </label>
                <div className="flex justify-center items-center mt-2">
                  <span className="mr-4 text-sm">Basic</span>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      id="prompt-type-switch"
                      className="toggle-switch-checkbox"
                      checked={state.useAdvancedPrompt}
                      onChange={togglePromptType}
                    />
                    <label className="toggle-switch-label" htmlFor="prompt-type-switch">
                      <span className="toggle-switch-inner"></span>
                      <span className="toggle-switch-switch"></span>
                    </label>
                  </div>
                  <span className="ml-4 text-sm">Advanced</span>
                </div>
              </div>
            </div>
          )}
        </form>
        <div className="flex justify-center mt-4">
          <button
            type="button"
            className="px-6 py-2 bg-gray-400 text-white rounded-md transition duration-200"
            disabled
          >
            <FontAwesomeIcon icon={faHourglassHalf} style={{ marginRight: '4px' }} /> YouTube URL to Quiz (Coming Soon)
          </button>

          <button
            type="button"
            className="px-6 py-2 bg-gray-400 ml-4 text-white rounded-md transition duration-200"
            disabled
          >
            <FontAwesomeIcon icon={faHourglassHalf} style={{ marginRight: '4px' }} /> Flashcards (Coming Soon)
          </button>
        </div>

        <div className="quote-container mt-10">
          <p className="quote-text">
            "Learning is a treasure that will follow its owner everywhere.*"<br />
            <span className="quote-author">— Chinese Proverb</span>
          </p>
          <p className="quote-note">
            <em>*Except into an exam</em>
          </p>
        </div>
      </div>
    </div>
  );
}

export default InitialUI;
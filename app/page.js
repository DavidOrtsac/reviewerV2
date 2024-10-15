// page.js

"use client";

import { useState, useRef, useEffect } from "react";
import PDFUploadForm from './components/PDFUploadForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { faLightbulb, faPlay, faCog, faHourglassHalf, faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import ReactGA from 'react-ga4';

ReactGA.initialize('G-M9HSPDRDPR');

export default function Home() {
  const [state, setState] = useState({
    isGenerating: false,
    userPrompt: "",
    isBlurred: false,
    isInputExpanded: true,
    buttonText: "Send",
    textSetByUpload: false,
    isButtonDisabled: false,
    MultipleChoiceQuestionCount: 7,
    TrueFalseQuestionCount: 3,
    showOptions: false,
    loaded: false,
    darkMode: false,
    useAdvancedPrompt: false,
  });

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [secondOutputComplete, setSecondOutputComplete] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);

  const abortController = useRef(null);
  const loadingInterval = useRef(null);

  // Set loaded to true after component mounts
  useEffect(() => {
    setState(prev => ({ ...prev, loaded: true }));
  }, []);

  // Retrieve dark mode preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem("darkMode");
      if (savedPreference) {
        setState(prev => ({ ...prev, darkMode: JSON.parse(savedPreference) }));
      }
    }
  }, []);

  // Toggle dark mode class on body and save preference
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('dark-mode', state.darkMode);
      localStorage.setItem("darkMode", JSON.stringify(state.darkMode));
    }
  }, [state.darkMode]);

  // Handle text set by PDF upload
  useEffect(() => {
    if (state.textSetByUpload && state.userPrompt.trim() && !state.isGenerating) {
      handleChatSubmit();
      setState(prev => ({ ...prev, textSetByUpload: false }));
    }
  }, [state.userPrompt, state.textSetByUpload]);

  // Load Typeform script when second output is complete
  useEffect(() => {
    if (secondOutputComplete) {
      const script = document.createElement("script");
      script.src = "//embed.typeform.com/next/embed.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [secondOutputComplete]);

  // Handle PDF text parsing
  const handlePDFText = (parsedText) => {
    setState(prev => ({ ...prev, userPrompt: parsedText, textSetByUpload: true }));
  };

  // Toggle visibility of options
  const toggleOptionsVisibility = () => {
    setState(prev => ({ ...prev, showOptions: !prev.showOptions }));
  };

  // Fetch prompt from API
  const fetchPrompt = async (promptName) => {
    const response = await fetch(`/api/prompts?promptName=${promptName}`);
    if (!response.ok) throw new Error(`Failed to fetch prompt: ${response.status}`);
    return (await response.json()).content;
  };

  // Handle form submission to generate quiz
  const handleChatSubmit = async (e) => {
    e?.preventDefault();

    const n_mcq = parseInt(state.MultipleChoiceQuestionCount, 10);
    const n_tf = parseInt(state.TrueFalseQuestionCount, 10);

    if (isNaN(n_mcq) || n_mcq <= 0 || isNaN(n_tf) || n_tf <= 0) {
      alert("Question counts must be positive integers.");
      return;
    }

    if (state.isGenerating || !state.userPrompt.trim()) return;

    setState(prev => ({
      ...prev,
      isGenerating: true,
      isBlurred: true,
      isButtonDisabled: true,
      buttonText: "Preparing Questions...",
    }));
    abortController.current = new AbortController();

    // Start loading time counter
    setLoadingTime(0);
    loadingInterval.current = setInterval(() => {
      setLoadingTime(prevTime => prevTime + 10);
    }, 10);

    try {
      const selectedPromptName = state.useAdvancedPrompt ? 'AdvancedQuizPrompt' : 'GenerateQuizPrompt';
      const generateQuizPromptTemplate = await fetchPrompt(selectedPromptName);

      const generateQuizPrompt = generateQuizPromptTemplate
        .replace('{MultipleChoiceQuestionCount}', n_mcq)
        .replace('{TrueFalseQuestionCount}', n_tf)
        .replace('{userPrompt}', state.userPrompt);

      const quizResponse = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ prompt: generateQuizPrompt }),
        headers: { "Content-Type": "application/json" },
        signal: abortController.current.signal,
      });

      if (!quizResponse.ok) throw new Error(`HTTP error! status: ${quizResponse.status}`);

      const quizText = await quizResponse.text();

      const parsedQuizData = parseQuizData(quizText);
      setQuizQuestions(parsedQuizData);

      // Proceed to generate HTML if needed
      setState(prev => ({
        ...prev,
        isGenerating: false,
        isBlurred: false,
        isButtonDisabled: false,
        buttonText: "Send",
      }));

      // Stop loading time counter
      clearInterval(loadingInterval.current);

      // Set second output complete to true
      setSecondOutputComplete(true);

    } catch (error) {
      if (error.name !== 'AbortError') console.error("Error during fetch:", error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        isBlurred: false,
        isButtonDisabled: false,
        buttonText: "Send",
      }));
      clearInterval(loadingInterval.current);
    }
  };

  // Parse the quiz text into structured data
  const parseQuizData = (data) => {
    const lines = data.split('\n');
    const questions = [];
    let currentQuestion = null;

    for (let line of lines) {
      line = line.trim();
      if (/^Question \d+:/.test(line)) {
        if (currentQuestion) {
          currentQuestion.showAnswer = false;
          questions.push(currentQuestion);
        }
        currentQuestion = {
          question: line.replace(/^Question \d+:\s*/, ''),
          options: [],
          answer: '',
          explanation: '',
          type: '',
          showAnswer: false,
          selectedOption: null,
          isAnswered: false,
          isCorrect: null,
        };
      } else if (/^[A-D]\)/.test(line)) {
        currentQuestion.options.push(line);
        currentQuestion.type = 'Multiple Choice';
      } else if (/^Answer:/.test(line)) {
        currentQuestion.answer = line.replace(/^Answer:\s*/, '');
        if (!currentQuestion.type) {
          currentQuestion.type = 'True/False';
          currentQuestion.options = ['True', 'False'];
        }
      } else if (/^Explanation:/.test(line)) {
        currentQuestion.explanation = line.replace(/^Explanation:\s*/, '');
      } else if (line === '') {
        // Empty line, skip
      } else {
        if (currentQuestion && !currentQuestion.options.length) {
          currentQuestion.question += ' ' + line;
        }
      }
    }

    if (currentQuestion) {
      currentQuestion.showAnswer = false;
      questions.push(currentQuestion);
    }

    return questions;
  };

  // Handle option selection
  const handleOptionSelect = (questionIndex, option) => {
    setQuizQuestions(prevQuestions =>
      prevQuestions.map((q, i) => {
        if (i === questionIndex && !q.isAnswered) {
          const isCorrect = q.type === 'Multiple Choice'
            ? option.startsWith(q.answer)
            : option === q.answer;
          return {
            ...q,
            selectedOption: option,
            isAnswered: true,
            isCorrect,
            showAnswer: true,
          };
        }
        return q;
      })
    );
  };

  // Handle cancellation of ongoing request
  const handleCancel = () => {
    if (abortController.current) {
      abortController.current.abort();
      setState(prev => ({
        ...prev,
        isGenerating: false,
        isBlurred: false,
        isButtonDisabled: false,
        buttonText: "Send",
      }));
      clearInterval(loadingInterval.current);
    }
  };

  // Handle example text loading
  const handleExampleText = async (e) => {
    e.preventDefault();
    const fileNames = ['AI', 'DigitalMarketing', 'HoneyBees', 'QuantumComputing', 'SolarSystem'];
    const fileName = fileNames[Math.floor(Math.random() * fileNames.length)];

    try {
      const text = await fetchPrompt(fileName);
      setState(prev => ({ ...prev, userPrompt: text }));
    } catch (error) {
      console.error("Error fetching example text:", error);
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setState(prev => ({ ...prev, darkMode: !prev.darkMode }));
  };

  // Toggle prompt type between Basic and Advanced
  const togglePromptType = () => {
    setState(prev => ({ ...prev, useAdvancedPrompt: !prev.useAdvancedPrompt }));
  };

  // Toggle input area visibility
  const toggleInputArea = () => {
    setState(prev => ({ ...prev, isInputExpanded: !prev.isInputExpanded }));
  };

  return (
    <main className={`min-h-screen p-4 flex justify-center items-center relative overflow-hidden ${state.darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      {/* Loading Screen */}
      {state.isGenerating && (
        <div className="loading-overlay fixed inset-0 flex flex-col justify-center items-center bg-white bg-opacity-75 z-50">
          <div className="text-2xl mb-4">Generating Quiz...</div>
          <div className="loading-animation text-xl mb-4">Please wait</div>
          <div className="text-lg">Elapsed Time: {(loadingTime / 1000).toFixed(2)} seconds</div>
        </div>
      )}

      <div className="max-w-4xl w-full z-10 relative">
        {/* Initial UI */}
        {!state.isGenerating && quizQuestions.length === 0 && (
          <div>
            <div className="text-center mb-8">
              <div style={{ fontFamily: 'Playfair Display, serif' }} className="font-sans text-4xl text-center mt-1 main-title">
                The<span className="text-red-600">SelfReview</span>Engine
              </div>
              <h2 className={`responsive-header mb-10 ${state.darkMode ? 'text-white' : 'text-black'}`}>
                Test your knowledge - Self-review by turning your study notes into quizzes
              </h2>
              
              <button onClick={toggleDarkMode} className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 text-black dark:bg-gray-800 dark:text-white">
                <FontAwesomeIcon icon={state.darkMode ? faSun : faMoon} />
              </button>
            </div>
            <div className="mb-20">
              <PDFUploadForm onPDFParse={handlePDFText} className="mt-10" />
              <form onSubmit={handleChatSubmit} className="space-y-4">
                <textarea
                  className={`textarea w-full p-4 border-2 border-gray-300 rounded-lg resize-y overflow-auto flex-grow user-input ${state.darkMode ? 'text-white bg-black' : 'text-black bg-white'}`}
                  placeholder="Or manually paste your story/essay/report here..."
                  value={state.userPrompt}
                  onChange={e => setState(prev => ({ ...prev, userPrompt: e.target.value }))}
                  rows="6"
                  maxLength="40000"
                />
                <div className="flex justify-between items-center">
                  <span className={`text-sm text-gray-600 counter ${state.darkMode ? 'text-white bg-black' : 'text-black bg-white'}`}>{state.userPrompt.length}/40000</span>
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
                <p className={`text-sm text-center ${state.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Files uploaded will not be stored</p>
                {state.showOptions && (
                  <div className="mt-4">
                    <div className="text-center">
                      <label htmlFor="multiple-choice-slider" className={`block text-sm font-medium ${state.darkMode ? 'text-white' : 'text-black'}`}>
                        Number of Multiple Choice Questions
                      </label>
                      <input
                        id="multiple-choice-slider"
                        type="range"
                        min="3"
                        max="10"
                        value={state.MultipleChoiceQuestionCount}
                        onChange={e => setState(prev => ({ ...prev, MultipleChoiceQuestionCount: e.target.value }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className={`text-sm text-gray-600 mt-2 ${state.darkMode ? 'text-white' : 'text-black'}`}>{state.MultipleChoiceQuestionCount}</div>
                    </div>
                    <div className="text-center mt-4">
                      <label htmlFor="true-false-slider" className={`block text-sm font-medium ${state.darkMode ? 'text-white' : 'text-black'}`}>
                        Number of True/False Questions
                      </label>
                      <input
                        id="true-false-slider"
                        type="range"
                        min="1"
                        max="5"
                        value={state.TrueFalseQuestionCount}
                        onChange={e => setState(prev => ({ ...prev, TrueFalseQuestionCount: e.target.value }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className={`text-sm text-gray-600 mt-2 ${state.darkMode ? 'text-white' : 'text-black'}`}>{state.TrueFalseQuestionCount}</div>
                    </div>
                    <div className="text-center mt-4">
                      <label htmlFor="prompt-type-switch" className={`block text-sm font-medium ${state.darkMode ? 'text-white' : 'text-black'}`}>
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
              
              {/* Embedded iframe */}
              <div className="iframe-wrapper mt-10 flex justify-center items-center">
                <iframe
                  src="https://lu.ma/embed/event/evt-t6GaPVkTzzLTkpM/simple"
                  width="600"
                  height="450"
                  frameBorder="0"
                  style={{ border: '1px solid #bfcbda88', borderRadius: '4px' }}
                  allowFullScreen
                  aria-hidden="false"
                  tabIndex="0"
                ></iframe>
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
        )}

        {/* Quiz Display */}
        {quizQuestions.length > 0 && (
          <div className="quiz-container mb-20">
            {quizQuestions.map((question, index) => (
              <div key={index} className="question mb-6 p-4 border rounded-lg shadow-md">
                <p className="font-bold mb-2">{index + 1}. {question.question}</p>
                <div className="options-container">
                  {question.options.map((option, idx) => {
                    const isSelected = question.selectedOption === option;
                    const isCorrectOption = question.type === 'Multiple Choice'
                      ? option.startsWith(question.answer)
                      : option === question.answer;
                    let optionStyle = 'px-4 py-2 mb-2 text-left w-full rounded';

                    if (question.isAnswered) {
                      if (isSelected && question.isCorrect) {
                        optionStyle += ' bg-green-500 text-white';
                      } else if (isSelected && !question.isCorrect) {
                        optionStyle += ' bg-red-500 text-white';
                      } else if (isCorrectOption) {
                        optionStyle += ' bg-green-200 text-black';
                      } else {
                        optionStyle += ' bg-gray-200 text-black';
                      }
                    } else {
                      optionStyle += ' bg-gray-100 hover:bg-gray-200';
                    }

                    return (
                      <button
                        key={idx}
                        className={optionStyle}
                        onClick={() => handleOptionSelect(index, option)}
                        disabled={question.isAnswered}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                {question.isAnswered && (
                  <>
                    <p className="mt-2">
                      {question.isCorrect ? (
                        <span className="text-green-600 font-bold">Correct!</span>
                      ) : (
                        <span className="text-red-600 font-bold">Incorrect!</span>
                      )} The correct answer is: <strong>{question.answer}</strong>
                    </p>
                    {question.explanation && (
                      <p className="mt-2"><strong>Explanation:</strong> {question.explanation}</p>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* Typeform Feedback Button */}
            {secondOutputComplete && (
              <>
                <div className="text-center mt-8 mb-4">
                  <hr />
                  <br />
                  <h2 className="text-2xl font-bold">Got a minute? You don't want to miss the chance to get smarter!</h2>
                  <p className="text-md mt-1">Get notified of weekly Reviewer app updates</p>
                </div>
                <div className="flex justify-center">
                  <div data-tf-live="01HHWJ49QMHTPZW7Z45W6CKXER"></div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Fixed Bottom Input Area */}
        {(state.isGenerating || quizQuestions.length > 0) && (
          <div>
            <div className={`fixed bottom-4 left-4 right-4 bg-white shadow-lg rounded-lg p-4 flex justify-between items-center ${state.darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {state.isInputExpanded && (
                <>
                  <input
                    type="text"
                    className={`w-full p-4 text-lg border-2 border-gray-300 rounded-lg mr-4 ${state.darkMode ? 'text-white bg-gray-700' : 'text-black bg-white'}`}
                    placeholder="Type your message..."
                    value={state.userPrompt}
                    onChange={e => setState(prev => ({ ...prev, userPrompt: e.target.value }))}
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
        )}

        {/* First Output Complete Message */}
        {quizQuestions.length > 0 && (
          <div className="text-center mt-8 mb-4">
            <p className="text-md">Please note that the questions are generated by AI and may contain mistakes. Consider verifying information.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className={`${state.isGenerating ? 'hidden' : ''} fixed bottom-0 left-0 right-0 z-1000 ${state.darkMode ? 'bg-black text-white' : 'bg-white text-gray-500'} text-center text-sm p-4`}>
        &copy; {new Date().getFullYear()} David Castro. All rights reserved.
        <br />
        <a href="https://calver.org" target="_blank" rel="noopener noreferrer">Release 2024.10.15</a>
        <br />
        <a href="https://discord.gg/5rDWAzWunK" target="_blank" rel="noopener noreferrer" className="discord-button" style={{ visibility: state.loaded ? 'visible' : 'hidden' }}>
          <FontAwesomeIcon icon={faDiscord} /> Discord
        </a>
      </footer>
    </main>
  );
}

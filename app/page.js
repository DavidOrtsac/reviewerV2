"use client";

import { useState, useRef, useEffect } from "react";
import PDFUploadForm from './components/PDFUploadForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { faFilePdf, faLightbulb, faPlay, faCog, faHourglassHalf, faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import ReactGA from 'react-ga4';

ReactGA.initialize('G-M9HSPDRDPR');

export default function Home() {
  const [state, setState] = useState({
    streamedData: "",
    isGenerating: false,
    firstOutputComplete: false,
    secondOutputComplete: false,
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
  });
  const abortController = useRef(null);

  const toggleInputArea = () => {
    setState(prev => ({ ...prev, isInputExpanded: !prev.isInputExpanded }));
  };

  useEffect(() => {
    setState(prev => ({ ...prev, loaded: true }));
  }, []);

  useEffect(() => {
    if (state.textSetByUpload && state.userPrompt.trim() && !state.isGenerating) {
      handleChatSubmit();
      setState(prev => ({ ...prev, textSetByUpload: false }));
    }
  }, [state.userPrompt, state.textSetByUpload]);

  useEffect(() => {
    const savedPreference = localStorage.getItem("darkMode");
    if (savedPreference) {
      setState(prev => ({ ...prev, darkMode: JSON.parse(savedPreference) }));
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', state.darkMode);
    localStorage.setItem("darkMode", JSON.stringify(state.darkMode));
  }, [state.darkMode]);

  const handlePDFText = (parsedText) => {
    setState(prev => ({ ...prev, userPrompt: parsedText, textSetByUpload: true }));
  };

  const toggleOptionsVisibility = () => {
    setState(prev => ({ ...prev, showOptions: !state.showOptions }));
  };

  useEffect(() => {
    if (state.secondOutputComplete) {
      const script = document.createElement("script");
      script.src = "//embed.typeform.com/next/embed.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [state.secondOutputComplete]);

  const streamResponse = async (response, setResponseData, onStreamStart, onComplete) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let data = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (onStreamStart && data === '') onStreamStart();
        data += decoder.decode(value, { stream: true }).replace(/\n/g, '');
        setResponseData(data);
      }
      if (onComplete) onComplete(data);
    } catch (error) {
      console.error("Streaming error:", error);
    }
  };

  const fetchPrompt = async (promptName) => {
    const response = await fetch(`/api/prompts?promptName=${promptName}`);
    return (await response.json()).content;
  };

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
      streamedData: "",
      firstOutputComplete: false,
      secondOutputComplete: false,
      isBlurred: true,
      isButtonDisabled: true,
      buttonText: "Preparing Questions...",
    }));
    abortController.current = new AbortController();

    try {
      const generateQuizPromptTemplate = await fetchPrompt('GenerateQuizPrompt');
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

      await streamResponse(quizResponse, data => setState(prev => ({ ...prev, streamedData: data })), null, async (quizText) => {
        setState(prev => ({ ...prev, firstOutputComplete: true, buttonText: "Generating Quiz..." }));

        const applyHtmlPromptTemplate = await fetchPrompt('ApplyHtmlPrompt');
        const applyHtmlPrompt = applyHtmlPromptTemplate
          .replace('{MultipleChoiceQuestionCount}', n_mcq)
          .replace('{TrueFalseQuestionCount}', n_tf)
          .replace('{quizText}', quizText);

        const htmlResponse = await fetch("/api/chat", {
          method: "POST",
          body: JSON.stringify({ prompt: applyHtmlPrompt }),
          headers: { "Content-Type": "application/json" },
          signal: abortController.current.signal,
        });

        if (!htmlResponse.ok) throw new Error(`HTTP error! status: ${htmlResponse.status}`);

        await streamResponse(htmlResponse, data => setState(prev => ({ ...prev, streamedData: data })), () => {
          setState(prev => ({ ...prev, isBlurred: false }));
        }, () => {
          setState(prev => ({ ...prev, secondOutputComplete: true }));
        });

        setState(prev => ({ ...prev, isGenerating: false, isButtonDisabled: false, buttonText: "Send" }));
      });
    } catch (error) {
      if (error.name !== 'AbortError') console.error("Error during fetch:", error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        isBlurred: false,
        isButtonDisabled: false,
        buttonText: "Send",
      }));
    }
  };

  const handleCancel = () => {
    if (abortController.current) {
      abortController.current.abort();
      setState(prev => ({
        ...prev,
        isGenerating: false,
        firstOutputComplete: false,
        secondOutputComplete: false,
        isBlurred: false,
        isButtonDisabled: false,
        buttonText: "Send",
      }));
    }
  };

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

  const toggleDarkMode = () => {
    setState(prev => ({ ...prev, darkMode: !state.darkMode }));
  };

  return (
    <main className={`min-h-screen p-4 flex justify-center items-center relative overflow-hidden ${state.darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className="max-w-4xl w-full z-10 relative">
        {!state.isGenerating && !state.streamedData && (
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
                      <span className="button-text-desktop">
                        <FontAwesomeIcon icon={faLightbulb} style={{ marginRight: '4px' }} /> Use Example
                      </span>
                      <span className="button-text-mobile">
                        <FontAwesomeIcon icon={faLightbulb} style={{ marginRight: '4px' }} /> Example
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={toggleOptionsVisibility}
                      style={{ visibility: state.loaded ? 'visible' : 'hidden' }}
                      className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 transition duration-200"
                    >
                      <span className="button-text-desktop">
                        <FontAwesomeIcon icon={faCog} style={{ marginRight: '4px' }} /> {state.showOptions ? 'Hide Options' : 'Show Options'}
                      </span>
                      <span className="button-text-mobile">
                        <FontAwesomeIcon icon={faCog} style={{ marginRight: '4px' }} /> {state.showOptions ? 'Options' : 'Options'}
                      </span>
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
                      <label htmlFor="multiple-choice-slider" className={`block text-sm font-medium text-gray-700 ${state.darkMode ? 'text-white bg-black' : 'text-black bg-white'}`}>
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
                      <div className={`text-sm text-gray-600 mt-2 ${state.darkMode ? 'text-white bg-black' : 'text-black bg-white'}`}>{state.MultipleChoiceQuestionCount}</div>
                    </div>
                    <div className="text-center mt-4">
                      <label htmlFor="true-false-slider" className={`block text-sm font-medium text-gray-700 ${state.darkMode ? 'text-white bg-black' : 'text-black bg-white'}`}>
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
                      <div className={`text-sm text-gray-600 mt-2 ${state.darkMode ? 'text-white bg-black' : 'text-black bg-white'}`}>{state.TrueFalseQuestionCount}</div>
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
              <div className="quote-container">
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
        
        <div className={`output-container ${state.isBlurred ? 'grayed-out' : ''}`}>
          {state.streamedData && <div dangerouslySetInnerHTML={{ __html: state.streamedData }}></div>}
        </div>
        {(state.isGenerating || state.streamedData) && (
          <div>
            <div className="fixed bottom-4 left-4 right-4 bg-white shadow-lg rounded-lg p-4 flex justify-between items-center">
              {state.isInputExpanded && (
                <>
                  <input
                    type="text"
                    className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg mr-4"
                    placeholder="Type your message..."
                    value={state.userPrompt}
                    onChange={e => setState(prev => ({ ...prev, userPrompt: e.target.value }))}
                    disabled={state.isGenerating}
                  />
                  <button
                    type="button"
                    onClick={handleChatSubmit}
                    className={`ml-4 px-6 py-2 rounded-md transition duration-200 ${state.isButtonDisabled ? 'bg-gray-400' : 'bg-black text-white hover:bg-gray-700'}`}
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
              <div className="input-toggle-button" onClick={toggleInputArea}>
                {state.isInputExpanded ? '▲' : '▼'}
              </div>
            </div>
          </div>
        )}
        {state.firstOutputComplete && (
          <div className="text-center mt-8 mb-4">
            <p className="text-md">Please note that the questions are generated by AI and may contain mistakes. Consider verifying information.</p>
          </div>
         )}
         {state.secondOutputComplete && (
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
       <br></br>

<footer className={`${state.isGenerating ? 'hidden' : ''} fixed bottom-0 left-0 right-0 z-1000 ${state.darkMode ? 'bg-black text-white' : 'bg-white text-gray-500'} text-center text-sm p-4`}>
  &copy; {new Date().getFullYear()} David Castro. All rights reserved.
  <br />
  <a href="https://calver.org" target="_blank" rel="noopener noreferrer">Release 2024.5.31</a>
  <br />
  <a href="https://discord.gg/5rDWAzWunK" target="_blank" rel="noopener noreferrer" className="discord-button" style={{ visibility: state.loaded ? 'visible' : 'hidden' }}>
    <FontAwesomeIcon icon={faDiscord} /> Discord
  </a>
</footer>


    </main>
  );
}

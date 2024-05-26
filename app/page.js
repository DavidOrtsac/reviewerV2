"use client";

import { useState, useRef, useEffect } from "react";
import PDFUploadForm from './components/PDFUploadForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { faFilePdf, faLightbulb, faPlay, faCog, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import ReactGA from 'react-ga4';

ReactGA.initialize('G-M9HSPDRDPR');

export default function Home() {
  const [streamedData, setStreamedData] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [firstOutputComplete, setFirstOutputComplete] = useState(false);
  const [secondOutputComplete, setSecondOutputComplete] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const abortController = useRef(null);
  const [isBlurred, setIsBlurred] = useState(false);
  const [isInputExpanded, setIsInputExpanded] = useState(true);
  const [buttonText, setButtonText] = useState("Send");
  const [textSetByUpload, setTextSetByUpload] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [MultipleChoiceQuestionCount, setMultipleChoiceQuestionCount] = useState(7);
  const [TrueFalseQuestionCount, setTrueFalseQuestionCount] = useState(3);
  const [showOptions, setShowOptions] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const toggleInputArea = () => {
    setIsInputExpanded(!isInputExpanded);
  };

  useEffect(() => {
    setLoaded(true);
}, []);

  useEffect(() => {
    if (textSetByUpload && userPrompt.trim() && !isGenerating) {
      handleChatSubmit(new Event('submit'));
      setTextSetByUpload(false); // Reset the flag after processing
    }
  }, [userPrompt, textSetByUpload]);  // React on changes in userPrompt and textSetByUpload


  const handlePDFText = (parsedText) => {
    setUserPrompt(parsedText);
    setTextSetByUpload(true);
  };

  const toggleOptionsVisibility = () => {
    setShowOptions(!showOptions);
  };

  const handlePDFProcessed = () => {
    if (userPrompt.trim() !== '') {
      handleChatSubmit(new Event('submit'));
    }
  };

  useEffect(() => {
    if (secondOutputComplete) {
      const script = document.createElement("script");
      script.src = "//embed.typeform.com/next/embed.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [secondOutputComplete]);

  const streamResponse = async (response, setResponseData, onStreamStart, onComplete) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let data = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (onStreamStart && data === '') {
          onStreamStart();
        }
        const chunk = decoder.decode(value, { stream: true });
        data += chunk.replace(/\n/g, '');
        setResponseData(data);
      }
      if (onComplete) {
        onComplete(data);
      }
    } catch (error) {
      console.error("Streaming error:", error);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();

    // Frontend Validation
    const n_mcq = parseInt(MultipleChoiceQuestionCount, 10);
    const n_true_or_false = parseInt(TrueFalseQuestionCount, 10);

    if (isNaN(n_mcq) || n_mcq <= 0) {
        alert("Number of multiple-choice questions must be a positive integer.");
        return;
    }

    if (isNaN(n_true_or_false) || n_true_or_false <= 0) {
        alert("Number of true/false questions must be a positive integer.");
        return;
    }

    if (isGenerating || !userPrompt.trim()) {
        return;
    }

    setIsGenerating(true);
    setStreamedData("");
    setFirstOutputComplete(false);
    setSecondOutputComplete(false);
    setIsBlurred(true);
    setIsButtonDisabled(true);
    setButtonText("Preparing Questions...");
    abortController.current = new AbortController();
    
   
   
  try {
    let promptResponse = await fetch(`/api/prompts?promptName=GenerateQuizPrompt`);
    let generateQuizPromptTemplate = (await promptResponse.json()).content;

    // Replace placeholders with actual values
    const generateQuizPrompt = generateQuizPromptTemplate
      .replace('{MultipleChoiceQuestionCount}', MultipleChoiceQuestionCount)
      .replace('{TrueFalseQuestionCount}', TrueFalseQuestionCount)
      .replace('{userPrompt}', userPrompt);

      const quizResponse = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ prompt: generateQuizPrompt }),
        headers: { "Content-Type": "application/json" },
        signal: abortController.current.signal
      });

      if (!quizResponse.ok) {
        throw new Error(`HTTP error! status: ${quizResponse.status}`);
      }

      await streamResponse(quizResponse, setStreamedData, null, async (quizText) => {
        setFirstOutputComplete(true);
        setButtonText("Generating Quiz...");
  
        promptResponse = await fetch(`/api/prompts?promptName=ApplyHtmlPrompt`);
        let applyHtmlPromptTemplate = (await promptResponse.json()).content;

        const applyHtmlPrompt = applyHtmlPromptTemplate
          .replace('{MultipleChoiceQuestionCount}', MultipleChoiceQuestionCount)
          .replace('{TrueFalseQuestionCount}', TrueFalseQuestionCount)
          .replace('{quizText}', quizText);
        
 
      const htmlResponse = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ prompt: applyHtmlPrompt }),
        headers: { "Content-Type": "application/json" },
        signal: abortController.current.signal
      });

      if (!htmlResponse.ok) {
        throw new Error(`HTTP error! status: ${htmlResponse.status}`);
      }

      await streamResponse(htmlResponse, setStreamedData, () => {
        setIsBlurred(false);
      }, () => {
        setSecondOutputComplete(true);
      });
      setIsGenerating(false);
      setIsButtonDisabled(false);
      setButtonText("Send");
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log("Fetch aborted by the user.");
    } else {
      console.error("Error during fetch:", error);
    }
    setIsGenerating(false);
    setIsBlurred(false);
    setIsButtonDisabled(false);
    setButtonText("Send");
  }
};

const handleCancel = () => {
  if (abortController.current) {
    abortController.current.abort();
    setIsGenerating(false);
    setFirstOutputComplete(false);
    setSecondOutputComplete(false);
    setIsBlurred(false);
    setIsButtonDisabled(false);
    setButtonText("Send");
  }
};

const handleInputChange = (e) => {
  setUserPrompt(e.target.value);
};

const handleExampleText = async (e) => {
  e.preventDefault();
  const fileNames = ['AI', 'DigitalMarketing', 'HoneyBees', 'QuantumComputing', 'SolarSystem'];
  const randomIndex = Math.floor(Math.random() * fileNames.length);
  const fileName = fileNames[randomIndex];

  try {
      const response = await fetch(`/api/prompts?promptName=${fileName}`);
      const text = (await response.json()).content;
      setUserPrompt(text);
  } catch (error) {
      console.error("Error fetching example text:", error);
  }
};


  return (
    <main className="bg-white min-h-screen p-4 bg-background-image flex justify-center items-center relative overflow-hidden">
      <div className="max-w-4xl w-full z-10 relative">
        {!isGenerating && !streamedData && (
        <div>
              <div className="text-center mb-8">
              <div style={{ fontFamily: 'Playfair Display, serif' }} className="font-sans text-4xl text-center mt-1 main-title">
  The<span className="text-red-600">SelfReview</span>Engine
</div>
<h2 className="responsive-header mb-10">
  Test your knowledge - Self-review by turning your study notes into quizzes
</h2>
        </div>
          <div className="mb-20"> {/* I'd like this div to have a margin bottom */}
          {/* To do that, I'd add the class "mb-4" to the div */}
  
          <PDFUploadForm onPDFParse={handlePDFText} onPDFProcessed={handlePDFProcessed} className="mt-10"/>
            
         <form onSubmit={handleChatSubmit} className="space-y-4">
         <textarea
  className="textarea w-full p-4 border-2 border-gray-300 rounded-lg resize-y overflow-auto flex-grow user-input"
  placeholder="Or manually paste your story/essay/report here..."
  value={userPrompt}
  onChange={handleInputChange}
  rows="6"
  maxLength="40000"
/>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 counter">{userPrompt.length}/40000</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExampleText} style={{ visibility: loaded ? 'visible' : 'hidden' }}
                  className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 transition duration-200"
                  disabled={isGenerating}
                >
                <span className="button-text-desktop" >< FontAwesomeIcon icon={faLightbulb} style={{ marginRight: '4px' }} /> Use Example</span>
                <span className="button-text-mobile"> <FontAwesomeIcon icon={faLightbulb} style={{ marginRight: '4px' }} /> Example</span>
                </button>
                  <button
                    type="button"
                    onClick={toggleOptionsVisibility} style={{ visibility: loaded ? 'visible' : 'hidden' }}
                    className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 transition duration-200"
                  >
                   <span className="button-text-desktop"><FontAwesomeIcon icon={faCog} style={{ marginRight: '4px' }} /> {showOptions ? 'Hide Options' : 'Show Options'}</span>
                    <span className="button-text-mobile"><FontAwesomeIcon icon={faCog} style={{ marginRight: '4px' }} />{showOptions ? 'Options' : 'Options'}</span>
                  </button>
                    <button style={{ visibility: loaded ? 'visible' : 'hidden' }}
                      type="submit"
                      className={`px-6 py-2 rounded-md transition duration-200 ${
                        isGenerating || userPrompt.trim() === '' ? 'bg-gray-400 text-white' : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                      disabled={isGenerating || userPrompt.trim() === ''}
                    >
                     <FontAwesomeIcon icon={faPlay} style={{ marginRight: '4px' }} /> Generate
                    </button>
                  </div>
                  {/* Add a notice saying that files uploaded will not be stored */}
                </div>
                <p className="text-sm text-gray-600 text-center">Files uploaded will not be stored</p>
                {showOptions && (
                  <div className="mt-4">
                    <div className="text-center">
                      <label htmlFor="multiple-choice-slider" className="block text-sm font-medium text-gray-700">
                        Number of Multiple Choice Questions
                      </label>
                      <input
                        id="multiple-choice-slider"
                        type="range"
                        min="3"
                        max="10"
                        value={MultipleChoiceQuestionCount}
                        onChange={(e) => setMultipleChoiceQuestionCount(e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="text-sm text-gray-600 mt-2">{MultipleChoiceQuestionCount}</div>
                    </div>
                    <div className="text-center mt-4">
                      <label htmlFor="true-false-slider" className="block text-sm font-medium text-gray-700">
                        Number of True/False Questions
                      </label>
                      <input
                        id="true-false-slider"
                        type="range"
                        min="1"
                        max="5"
                        value={TrueFalseQuestionCount}
                        onChange={(e) => setTrueFalseQuestionCount(e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="text-sm text-gray-600 mt-2">{TrueFalseQuestionCount}</div>
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
            </div>
          </div>
        )}

      <div className={`output-container ${isBlurred ? 'grayed-out' : ''}`}>
        {streamedData && <div dangerouslySetInnerHTML={{ __html: streamedData }}></div>}
      </div>

      {(isGenerating || streamedData) && (
        <div>
        <div className="fixed bottom-4 left-4 right-4 bg-white shadow-lg rounded-lg p-4 flex justify-between items-center">
          {isInputExpanded && (
            <>
              <input
                type="text"
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg mr-4"
                placeholder="Type your message..."
                value={userPrompt}
                onChange={handleInputChange}
                disabled={isGenerating}
              />
              <button
                type="button"
                onClick={handleChatSubmit}
                className={`ml-4 px-6 py-2 rounded-md transition duration-200 ${
                  isButtonDisabled ? 'bg-gray-400' : 'bg-black text-white hover:bg-gray-700'
                }`}
                disabled={isButtonDisabled || userPrompt.trim() === ''}
              >
                {buttonText}
              </button>
              {isGenerating && (
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
            {isInputExpanded ? '▲' : '▼'}
          </div>
        </div>
        </div>
      )}
      {firstOutputComplete && (
        <div className="text-center mt-8 mb-4">
          <p className="text-md">Please note that the questions are generated by AI and may contain mistakes. Consider verifying information.</p>
        </div>
      )}
      


      {secondOutputComplete && (
        <div className="text-center mt-8 mb-4">
                    <hr></hr>
                    <br></br>
          <h2 className="text-2xl font-bold">Got a minute? You don't want to miss the chance to get smarter!</h2>
          <p className="text-md mt-1">Get notified of weekly Reviewer app updates</p>
        </div>
      )}
      {secondOutputComplete && (
        <div className="flex justify-center mb-32">
          <div data-tf-live="01HHWJ49QMHTPZW7Z45W6CKXER"></div>
        </div>
      )}
    </div>
    <footer className={`${isGenerating ? 'hidden' : ''} fixed bottom-0 left-0 right-0 z-1000 bg-white text-center text-gray-500 text-sm p-4`}>
    &copy; {new Date().getFullYear()} David Castro. All rights reserved.
    <br></br>
<a href="https://calver.org" target="_blank" rel="noopener noreferrer">Release 2024.5.26</a>
<br></br>
<a href="https://discord.gg/5rDWAzWunK" target="_blank" rel="noopener noreferrer" className="discord-button" style={{ visibility: loaded ? 'visible' : 'hidden' }}>
                <FontAwesomeIcon icon={faDiscord} /> Discord
            </a>
  </footer>
  </main>

  );
}

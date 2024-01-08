"use client";

import { useState, useRef, useEffect } from "react";

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
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const toggleInputArea = () => {
    setIsInputExpanded(!isInputExpanded);
  };

  useEffect(() => {
    if (secondOutputComplete) { // Changed from firstOutputComplete to secondOutputComplete
      const script = document.createElement("script");
      script.src = "//embed.typeform.com/next/embed.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [secondOutputComplete]); // Changed from firstOutputComplete to secondOutputComplete

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
    setIsGenerating(true);
    setStreamedData("");
    setFirstOutputComplete(false);
    setSecondOutputComplete(false); // Resetting second output state
    setIsBlurred(true);
    setIsButtonDisabled(true);
    setButtonText("Preparing Questions...");
    abortController.current = new AbortController();

    try {
      const generateQuizPrompt = `Convert the following passage into a quiz with 7 questions, four choices each, and the answer appended at the end of each question:\n\n${userPrompt}`;

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
  
        const applyHtmlPrompt = `You are a code writer tasked to generate an HTML worksheet with embedded CSS. Your sole purpose is to write clean, functional code without any comments, explanations, or unnecessary labels. You are not to engage in conversation or provide meta-comments.

      1. The text must always be black. Do not change the font.
      2. Each QUESTION TEXT must be placed within the .questionBox class. Do not style the questionBox class. DO NOT FORGET TO ADD THE QUESTION.
      3. Each of the CHOICES must be placed under their respective questions. Give the <p> tags the .choiceBox class. Do not style the choiceBox class.
      4. The ANSWER must be placed in a div box under their respective choices. Its class name is "answerBox". DO NOT STYLE THE ANSWERBOX.
      5. Do not put shadows.
      6. Complete any incomplete questions if they lack choices or answer.
      7. EACH QUESTION MUST BE NUMBERED.
      8. LIMIT THE QUESTIONS TO 7 ONLY.
      9. EACH QUESTION MUST HAVE 4 CHOICES.
      
      Apply HTML to this quiz: ${quizText}
      
      Generate the worksheet code immediately below this line. Do not include any other information, and do not speak. DO NOT ENCLOSE THE CODE WITHIN ANYTHING, INCLUDING BACKTICKS OR QUOTATIONS:`;

 
 
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
        setSecondOutputComplete(true); // Set second output to complete here
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
    const fileNames = ['AI.txt', 'DigitalMarketing.txt', 'HoneyBees.txt', 'QuantumComputing.txt', 'SolarSystem.txt'];
    const randomIndex = Math.floor(Math.random() * fileNames.length);
    const fileName = fileNames[randomIndex];

    try {
      const response = await fetch(`/prompts/${fileName}`);
      const text = await response.text();
      setUserPrompt(text);
    } catch (error) {
      console.error("Error fetching example text:", error);
    }
  };

  return (
    <main className="bg-white min-h-screen p-4 flex justify-center items-center">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold main-title">The Self-Quiz Engine</h1>
          <p className="text-xl mt-2">by David Castro</p>
        </div>

        {!isGenerating && !streamedData && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <form onSubmit={handleChatSubmit} className="space-y-4">
              <textarea
                className="textarea w-full p-4 border-2 border-gray-300 rounded-lg resize-y overflow-auto"
                placeholder="Paste your story/essay/report here..."
                value={userPrompt}
                onChange={handleInputChange}
                rows="6"
                maxLength="14000"
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{userPrompt.length}/14000</span>
                <button
                  type="button"
                  onClick={handleExampleText}
                  className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 transition duration-200"
                  disabled={isGenerating}
                >
                  Use Example
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition duration-200"
                  disabled={isGenerating || userPrompt.trim() === ''}
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        )}

        <div className={`output-container ${isBlurred ? 'grayed-out' : ''}`}>
          {streamedData && (
            <div dangerouslySetInnerHTML={{ __html: streamedData }}></div>
          )}
        </div>

        {(isGenerating || streamedData) && (
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
                  className={`ml-4 px-6 py-2 rounded-md transition duration-200 ${isButtonDisabled ? 'bg-gray-400' : 'bg-black text-white hover:bg-gray-700'}`}
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
        )}

<hr></hr>

{secondOutputComplete && (
          <div className="text-center mt-8 mb-4">
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
    </main>
  );
}
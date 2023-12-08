"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [streamedData, setStreamedData] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [firstOutputComplete, setFirstOutputComplete] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const abortController = useRef(null);

  const streamResponse = async (response, setResponseData, onComplete) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let data = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        data += chunk.replace(/\n/g, '<pre>'); // Replace newlines with <br> for HTML display
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
    setFirstOutputComplete(false); // Reset when starting a new generation
    abortController.current = new AbortController();

    try {
      const generateQuizPrompt = `Convert the following passage into a quiz with 10 questions, four choices each, and the answer appended at the end of each question:\n\n${userPrompt}`;

      const quizResponse = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ prompt: generateQuizPrompt }),
        headers: { "Content-Type": "application/json" },
        signal: abortController.current.signal
      });

      if (!quizResponse.ok) {
        throw new Error(`HTTP error! status: ${quizResponse.status}`);
      }

      // Stream the first response and update streamedData state
      await streamResponse(quizResponse, setStreamedData, async (quizText) => {
        setFirstOutputComplete(true); // Indicate that the first output is complete

        // Prepare the second prompt using the quizText
  
        const applyHtmlPrompt = `You are a code writer tasked to generate an HTML worksheet with embedded CSS. Your sole purpose is to write clean, functional code without any comments, explanations, or unnecessary labels. You are not to engage in conversation or provide meta-comments.

      2. The text must always be black. Do not change the font.
      3. Do not style the body. Do not change any fonts.
      4. Each question must be placed in a question box. Give it the .questionBox class. Do not style the questionBox class.
      5. Each of the choices must be placed under their respective questions. Give the <p> tags the .choiceBox class. Do not style the choiceBox class.
      6. The answer must be placed in a div box under their respective choices. Its class name is "answerBox". DO NOT STYLE THE ANSWERBOX.
      7. Do not put shadows.
      8. Complete any incomplete questions if they lack choices or answer.
      9. EACH QUESTION MUST BE NUMBERED.
      10. LIMIT THE QUESTIONS TO 10 ONLY.
      11. EACH QUESTION MUST HAVE 4 CHOICES.
      
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

      // Stream the second response and reset streamedData state before streaming
      setStreamedData(""); // Clear the existing data
      await streamResponse(htmlResponse, setStreamedData);
      setIsGenerating(false); // Set isGenerating to false after the second output is done
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log("Fetch aborted by the user.");
    } else {
      console.error("Error during fetch:", error);
    }
    setIsGenerating(false); // Also set isGenerating to false in case of an error
  }
};

const handleCancel = () => {
  if (abortController.current) {
    abortController.current.abort();
    setIsGenerating(false);
    setFirstOutputComplete(false); // Reset when cancelling
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

<div className="relative bg-white shadow-lg rounded-lg p-6 mb-6">
          {streamedData && (
            <div dangerouslySetInnerHTML={{ __html: streamedData }}></div>
          )}
          {/* Conditionally render the overlay within the output container */}
          {isGenerating && !firstOutputComplete && (
            <div className="absolute top-0 left-0 right-0 bottom-0 bg-white bg-opacity-50 backdrop-blur-sm z-10"></div>
          )}
        </div>

      {(isGenerating || streamedData) && (
        <div className="fixed bottom-4 left-4 right-4 bg-white shadow-lg rounded-lg p-4 flex justify-between items-center">
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
            className="ml-4 px-6 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition duration-200"
            disabled={isGenerating || userPrompt.trim() === ''}
          >
            {isGenerating ? "Sending..." : "Send"}
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
        </div>
      )}
    </div>
  </main>
);
}
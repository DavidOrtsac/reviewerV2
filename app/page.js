"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [streamedData, setStreamedData] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [canCancel, setCanCancel] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const abortController = useRef(null);

  const convertDelimitersToHTML = (data) => {
    return data.replace(/\|\{/g, '<p className="choiceBox">').replace(/\}\|/g, '</p>');
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setCanCancel(true);

    abortController.current = new AbortController();

    const fullPrompt = `You are a code writer tasked to generate an HTML worksheet with embedded CSS. Your sole purpose is to write clean, functional code without any comments, explanations, or unnecessary labels. You are not to engage in conversation or provide meta-comments.

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
    
    User-Specific Instructions:
    ${userPrompt}
    
    Generate the worksheet code immediately below this line. Do not include any other information, and do not speak. DO NOT ENCLOSE THE CODE WITHIN ANYTHING, INCLUDING BACKTICKS OR QUOTATIONS.`;

    try {
      const response = await fetch("api/chat", {
        method: "POST",
        body: JSON.stringify({ prompt: fullPrompt }),
        headers: { "Content-Type": "application/json" },
        signal: abortController.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const processedChunk = convertDelimitersToHTML(chunk);
        setStreamedData((prevData) => prevData + processedChunk);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log("Fetch aborted");
      } else {
        console.error("Fetching error:", error);
      }
    } finally {
      setIsGenerating(false);
      setCanCancel(false);
      abortController.current = null;
    }
  };

  const handleCancel = () => {
    if (abortController.current) {
      abortController.current.abort();
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
    <main className="bg-white min-h-screen p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-5xl main-title">The Self-Quiz Engine</h1>
          <p className="text-xl">by David Castro</p>
        </div>
  
        {/* Render the textarea and associated elements only if not generating and no streamedData */}
        {!isGenerating && !streamedData && (
          <div className="mt-8">
            <form onSubmit={handleChatSubmit} className="flex flex-col gap-4">
              <textarea
                className="textarea"
                style={{ overflow: 'auto' }}
                placeholder="Paste your story/essay/report here and the AI will convert it into a self-study quiz."
                value={userPrompt}
                onChange={handleInputChange}
                rows="6"
                maxLength="14000"
                disabled={isGenerating}
              />
              <button
                onClick={handleExampleText}
                className="use-example-button"
                disabled={isGenerating}
              >
                Use Example
              </button>
              <div className="flex justify-between items-center">
                <div className="character-count">
                  {userPrompt.length}/14000
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-400"
                  disabled={isGenerating || userPrompt.trim() === ''}
                >
                  {isGenerating ? "Generating..." : "Generate"}
                </button>
              </div>
            </form>
          </div>
        )}
  
        {/* Display streamedData if available */}
        {streamedData && (
          <div style={{ paddingBottom: '100px' }}>
            <div dangerouslySetInnerHTML={{ __html: streamedData }}></div>
          </div>
        )}
  
        {/* Render this section if isGenerating or if streamedData is not empty */}
        {(isGenerating || streamedData) && (
          <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-4xl px-4 bg-white">
            <form className="flex justify-between items-center p-4 border-t-2 border-gray-300">
              <input
                type="text"
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none"
                style={{ overflow: 'auto' }}
                placeholder="Type your message..."
                value={userPrompt}
                onChange={handleInputChange}
                disabled={isGenerating}
              />
              <button
                type="button"
                onClick={handleChatSubmit}
                className="ml-4 px-6 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-400"
                disabled={isGenerating || userPrompt.trim() === ''}
              >
                {isGenerating ? "Sending..." : "Send"}
              </button>
              {isGenerating && (
                <button
                  onClick={handleCancel}
                  className="ml-4 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Cancel
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </main>
  );
  
}
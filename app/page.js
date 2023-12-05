"use client";

import { useState } from "react";

export default function Home() {
  const [streamedData, setStreamedData] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");

  // Function to convert delimiters into HTML tags in the streamed data
  const convertDelimitersToHTML = (data) => {
    return data.replace(/\|\{/g, '<p className="choiceBox">').replace(/\}\|/g, '</p>');
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    // Construct the fullPrompt using userPrompt state
    const fullPrompt = `You are a code writer tasked to generate an HTML worksheet with embedded CSS. Your sole purpose is to write clean, functional code without any comments, explanations, or unnecessary labels. You are not to engage in conversation or provide meta-comments.

    2. The text must always be black. Do not change the font.
    3. Do not style the body. Do not change any fonts.
    4. Each question must be placed in a question box. Give it the .questionBox class. Do not style the questionBox class.
    5. Each of the choices must be placed under their respective questions. Give the <p> tags the .choiceBox class. Do not style the choiceBox class.
    6. The answer must be placed in a div box under their respective choices. It's class name is "answerBox". DO NOT STYLE THE ANSWERBOX.
    7. Do not put shadows.
    8. Complete any incomplete questions if they lack choices or answer.
    9. EACH QUESTION MUST BE NUMBERED.
    10. LIMIT THE QUESTIONS TO 10 ONLY.
    11. EACH QUESTION MUST HAVE 4 CHOICES.
    
    User-Specific Instructions:
    ${userPrompt}
    
    Generate the worksheet code immediately below this line. Do not include any other information, and do not speak. DO NOT ENCLOSE THE CODE WITHIN ANYTHING, INCLUDING BACKTICKS OR QUOTATIONS.
    `;
    try {
      const response = await fetch("api/chat", {
        method: "POST",
        body: JSON.stringify({ prompt: fullPrompt }),
        headers: { "Content-Type": "application/json" },
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
      console.error("Fetching error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (e) => {
    setUserPrompt(e.target.value);
  };


  
return (
  <main className="bg-white min-h-screen p-4">
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-4"> {/* Remove fixed positioning and add margin-bottom */}
        <h1 className="text-5xl main-title">The Self-Quiz Engine</h1>
        <p className="text-xl">by David Castro</p>
      </div>
      {!streamedData && (
        <div className="mt-8"> {/* Add margin-top for spacing */}
          <form onSubmit={handleChatSubmit} className="flex flex-col gap-4">
            <textarea
              className="textarea"
              placeholder="Paste your story/essay/report here and the AI will convert it into a self-study quiz."
              value={userPrompt}
              onChange={handleInputChange}
              rows="6"
              maxLength="14000"
              disabled={isGenerating}
            />
            <div className="flex justify-between items-center">
              <div className="character-count">
                {userPrompt.length}/14000
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-400"
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
          </form>
        </div>
      )}

{streamedData && (
  <div style={{ paddingBottom: '100px' }}> {/* Inline style to add padding at the bottom */}
    <div dangerouslySetInnerHTML={{__html: streamedData}}></div>
  </div>
)}
    </div>

    {streamedData && (
  <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-4xl px-4 bg-white">
    <form onSubmit={handleChatSubmit} className="flex justify-between items-center p-4 border-t-2 border-gray-300">
      <input
        type="text"
        className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none"
        placeholder="Type your message..."
        value={userPrompt}
        onChange={handleInputChange}
        disabled={isGenerating}
      />
      <button
        type="submit"
        className="ml-4 px-6 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-400"
        disabled={isGenerating}
      >
        {isGenerating ? "Sending..." : "Send"}
      </button>
    </form>
  </div>
)}
  </main>
);

}
// page.js

"use client";

import { useState, useRef, useEffect } from "react";
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoadingOverlay from './components/LoadingOverlay';
import InitialUI from './components/InitialUI';
import QuizDisplay from './components/QuizDisplay';
import FixedInputArea from './components/FixedInputArea';
import Footer from './components/Footer';
import ReactGA from 'react-ga4';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import {
  faLightbulb,
  faPlay,
  faCog,
  faHourglassHalf,
  faSun,
  faMoon,
  faSave,
  faTrash,
  faBars,
  faTimes,
  faRedo,
} from '@fortawesome/free-solid-svg-icons';

ReactGA.initialize('G-M9HSPDRDPR');

export default function Home() {
  // State variables
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
    showSidebar: false,
    quizMode: 'general',
  });

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [secondOutputComplete, setSecondOutputComplete] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [chunkProgress, setChunkProgress] = useState({ current: 0, total: 0 });
  const [quizScore, setQuizScore] = useState(null);

  const abortController = useRef(null);
  const loadingInterval = useRef(null);

  // Set loaded to true after component mounts
  useEffect(() => {
    setState(prev => ({ ...prev, loaded: true }));
    const quizzes = localStorage.getItem('savedQuizzes');
    if (quizzes) {
      setSavedQuizzes(JSON.parse(quizzes));
    }
  }, []);

  // Save quizzes to localStorage whenever savedQuizzes state changes
  useEffect(() => {
    localStorage.setItem('savedQuizzes', JSON.stringify(savedQuizzes));
  }, [savedQuizzes]);

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

  // State setters to pass to components
  const setUserPrompt = (userPrompt) => {
    setState(prev => ({ ...prev, userPrompt }));
  };

  const setMultipleChoiceQuestionCount = (value) => {
    setState(prev => ({ ...prev, MultipleChoiceQuestionCount: value }));
  };

  const setTrueFalseQuestionCount = (value) => {
    setState(prev => ({ ...prev, TrueFalseQuestionCount: value }));
  };

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

  // Function to split text into chunks based on token limit
  const splitTextIntoChunks = (text, maxTokensPerChunk) => {
    const tokensPerChar = 0.25;
    const maxCharsPerChunk = Math.floor(maxTokensPerChunk / tokensPerChar);
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxCharsPerChunk;
      if (end > text.length) {
        end = text.length;
      } else {
        const lastPeriod = text.lastIndexOf('.', end);
        if (lastPeriod > start) {
          end = lastPeriod + 1;
        }
      }
      const chunk = text.slice(start, end).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      start = end;
    }

    return chunks;
  };

  const handleQuizModeChange = (event) => {
    setState(prev => ({ ...prev, quizMode: event.target.value }));
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

    if (n_mcq + n_tf > 20) {
      alert("Please request 20 questions or fewer.");
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

    setQuizScore(null);
    setLoadingTime(0);
    loadingInterval.current = setInterval(() => {
      setLoadingTime(prevTime => prevTime + 10);
    }, 10);

    const maxRetries = 3;
    let attempt = 0;
    let success = false;

    while (attempt < maxRetries && !success) {
      try {
        attempt++;
        const selectedPromptName = state.useAdvancedPrompt ? 'AdvancedQuizPrompt' : 'GenerateQuizPrompt';
        const generateQuizPromptTemplate = await fetchPrompt(selectedPromptName);
        const maxTokensPerChunk = 2000;
        const textChunks = splitTextIntoChunks(state.userPrompt, maxTokensPerChunk);

        setChunkProgress({ current: 0, total: textChunks.length });

        let allQuestions = [];
        let questionNumberOffset = 0;

        for (let i = 0; i < textChunks.length; i++) {
          const chunk = textChunks[i];
          const chunkPrompt = generateQuizPromptTemplate
            .replace('{MultipleChoiceQuestionCount}', n_mcq)
            .replace('{TrueFalseQuestionCount}', n_tf)
            .replace('{userPrompt}', chunk);

          const quizResponse = await fetch("/api/chat", {
            method: "POST",
            body: JSON.stringify({ prompt: chunkPrompt }),
            headers: { "Content-Type": "application/json" },
            signal: abortController.current.signal,
          });

          if (!quizResponse.ok) throw new Error(`HTTP error! status: ${quizResponse.status}`);

          const quizText = await quizResponse.text();
          const parsedQuizData = parseQuizData(quizText);
          parsedQuizData.forEach(q => {
            q.questionNumber += questionNumberOffset;
          });

          allQuestions = allQuestions.concat(parsedQuizData);
          questionNumberOffset = allQuestions.length;
          setChunkProgress({ current: i + 1, total: textChunks.length });
        }

        setQuizQuestions(allQuestions);
        setState(prev => ({
          ...prev,
          isGenerating: false,
          isBlurred: false,
          isButtonDisabled: false,
          buttonText: "Send",
        }));

        clearInterval(loadingInterval.current);
        setSecondOutputComplete(true);
        success = true;

      } catch (error) {
        if (error.name === 'AbortError') {
          console.log("Fetch aborted by the user.");
          setState(prev => ({
            ...prev,
            isGenerating: false,
            isBlurred: false,
            isButtonDisabled: false,
            buttonText: "Send",
          }));
          clearInterval(loadingInterval.current);
          return;
        } else {
          console.error(`Attempt ${attempt} failed:`, error);
          if (attempt >= maxRetries) {
            alert(`An error occurred after ${maxRetries} attempts: ${error.message}`);
            setState(prev => ({
              ...prev,
              isGenerating: false,
              isBlurred: false,
              isButtonDisabled: false,
              buttonText: "Send",
            }));
            clearInterval(loadingInterval.current);
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  };

  // Parse the quiz text into structured data
  const parseQuizData = (data) => {
    const lines = data.split('\n');
    const questions = [];
    let currentQuestion = null;

    for (let line of lines) {
      line = line.trim();
      if (/^Question (\d+):/.test(line)) {
        const match = line.match(/^Question (\d+):\s*(.*)/);
        if (match) {
          if (currentQuestion) {
            currentQuestion.showAnswer = false;
            questions.push(currentQuestion);
          }
          currentQuestion = {
            questionNumber: parseInt(match[1], 10),
            question: match[2],
            options: [],
            answer: '',
            explanation: '',
            type: '',
            showAnswer: false,
            selectedOption: null,
            isAnswered: false,
            isCorrect: null,
          };
        }
      } else if (/^[A-D]\)/.test(line)) {
        currentQuestion.options.push(line);
        currentQuestion.type = 'Multiple Choice';
      } else if (/^Answer:/.test(line)) {
        currentQuestion.answer = line.replace(/^Answer:\s*/, '').trim();
        if (!currentQuestion.type) {
          currentQuestion.type = 'True/False';
          currentQuestion.options = ['True', 'False'];
        }
      } else if (/^Explanation:/.test(line)) {
        currentQuestion.explanation = line.replace(/^Explanation:\s*/, '').trim();
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

    // Post-processing to ensure consistency
    questions.forEach((q) => {
      if (q.type === 'Multiple Choice') {
        const answerMatch = q.answer.match(/^[A-D]$/i);
        if (answerMatch) {
          q.answer = answerMatch[0].toUpperCase();
        } else {
          const optionIndex = q.options.findIndex((opt) => {
            const optionText = opt.substring(3).trim().toLowerCase();
            return (
              opt.substring(0, 1).toUpperCase() === q.answer.toUpperCase() ||
              optionText === q.answer.toLowerCase()
            );
          });
          if (optionIndex !== -1) {
            q.answer = ['A', 'B', 'C', 'D'][optionIndex];
          } else {
            console.warn(`Could not match answer "${q.answer}" to options in question ${q.questionNumber}.`);
          }
        }
      }
    });

    return questions;
  };

  // Handle option selection
  const handleOptionSelect = (questionIndex, option) => {
    setQuizQuestions((prevQuestions) => {
      const updatedQuestions = prevQuestions.map((q, i) => {
        if (i === questionIndex && !q.isAnswered) {
          let isCorrect = false;
          if (q.type === 'Multiple Choice') {
            const selectedOptionLetter = option.charAt(0).toUpperCase();
            const selectedOptionText = option.substring(3).trim().toLowerCase();
            if (q.answer.length === 1) {
              isCorrect = selectedOptionLetter === q.answer.toUpperCase();
            } else {
              isCorrect = selectedOptionText === q.answer.toLowerCase();
            }
          } else if (q.type === 'True/False') {
            isCorrect = option.toLowerCase() === q.answer.toLowerCase();
          }
          return {
            ...q,
            selectedOption: option,
            isAnswered: true,
            isCorrect,
            showAnswer: true,
          };
        }
        return q;
      });

      const allAnswered = updatedQuestions.every((q) => q.isAnswered);
      if (allAnswered) {
        const correctAnswers = updatedQuestions.filter((q) => q.isCorrect).length;
        const totalQuestions = updatedQuestions.length;
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        setQuizScore(score);
      }

      return updatedQuestions;
    });
  };

  // Reset quiz answers
  const resetQuiz = () => {
    setQuizQuestions(prevQuestions =>
      prevQuestions.map(q => ({
        ...q,
        selectedOption: null,
        isAnswered: false,
        isCorrect: null,
        showAnswer: false,
      }))
    );
    setQuizScore(null);
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
      alert(`Error fetching example text: ${error.message}`);
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

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setState(prev => ({ ...prev, showSidebar: !prev.showSidebar }));
  };

  // Save current quiz
  const saveCurrentQuiz = () => {
    if (quizQuestions.length === 0) {
      alert("No quiz to save.");
      return;
    }

    const quizTitle = prompt("Enter a title for this quiz:", `Quiz ${savedQuizzes.length + 1}`);
    if (quizTitle === null) return;

    const newQuiz = {
      id: Date.now(),
      title: quizTitle,
      timestamp: new Date().toLocaleString(),
      questions: quizQuestions,
    };

    setSavedQuizzes(prevQuizzes => [...prevQuizzes, newQuiz]);
    alert("Quiz saved successfully!");
  };

  // Load a saved quiz
  const loadSavedQuiz = (quizId) => {
    const quiz = savedQuizzes.find(q => q.id === quizId);
    if (quiz) {
      setQuizQuestions(quiz.questions);
      setSecondOutputComplete(true);
      setQuizScore(null);
      setState(prev => ({ ...prev, showSidebar: false }));
    }
  };

  // Delete a saved quiz
  const deleteSavedQuiz = (quizId) => {
    if (window.confirm("Are you sure you want to delete this quiz?")) {
      setSavedQuizzes(prevQuizzes => prevQuizzes.filter(q => q.id !== quizId));
    }
  };

  return (
    <main className={`min-h-screen p-4 flex justify-center items-center relative overflow-hidden ${state.darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      {/* Sidebar */}
      <Sidebar
        showSidebar={state.showSidebar}
        toggleSidebar={toggleSidebar}
        savedQuizzes={savedQuizzes}
        loadSavedQuiz={loadSavedQuiz}
        deleteSavedQuiz={deleteSavedQuiz}
        darkMode={state.darkMode}
      />

      {/* Loading Overlay */}
      <LoadingOverlay
        isGenerating={state.isGenerating}
        loadingTime={loadingTime}
        chunkProgress={chunkProgress}
      />

      <div className="max-w-4xl w-full z-10 relative">
        {/* Header */}
        <Header
          toggleSidebar={toggleSidebar}
          toggleDarkMode={toggleDarkMode}
          darkMode={state.darkMode}
        />

        {/* Initial UI */}
        {!state.isGenerating && quizQuestions.length === 0 && (
          <InitialUI
            state={{
              ...state,
              setUserPrompt,
              setMultipleChoiceQuestionCount,
              setTrueFalseQuestionCount,
            }}
            handlePDFText={handlePDFText}
            handleChatSubmit={handleChatSubmit}
            handleExampleText={handleExampleText}
            toggleOptionsVisibility={toggleOptionsVisibility}
            togglePromptType={togglePromptType}
            handleQuizModeChange={handleQuizModeChange}
            darkMode={state.darkMode}
          />
        )}

        {/* Quiz Display */}
        {quizQuestions.length > 0 && (
          <QuizDisplay
            quizQuestions={quizQuestions}
            saveCurrentQuiz={saveCurrentQuiz}
            resetQuiz={resetQuiz}
            handleOptionSelect={handleOptionSelect}
            quizScore={quizScore}
            secondOutputComplete={secondOutputComplete}
          />
        )}

        {/* Fixed Bottom Input Area */}
        <FixedInputArea
          state={{
            ...state,
            setUserPrompt,
            quizQuestions,
          }}
          toggleInputArea={toggleInputArea}
          handleChatSubmit={handleChatSubmit}
          handleCancel={handleCancel}
          darkMode={state.darkMode}
        />

        {/* First Output Complete Message */}
        {quizQuestions.length > 0 && (
          <div className="text-center mt-8 mb-4">
            <p className="text-md">Please note that the questions are generated by AI and may contain mistakes. Consider verifying information.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer
        isGenerating={state.isGenerating}
        darkMode={state.darkMode}
        loaded={state.loaded}
      />
    </main>
  );
}

// QuizDisplay.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faRedo } from '@fortawesome/free-solid-svg-icons';
import Question from './Question';

function QuizDisplay({ quizQuestions, saveCurrentQuiz, resetQuiz, handleOptionSelect, quizScore, secondOutputComplete }) {
  return (
    <div className="quiz-container mb-20">
      <div className="flex justify-end mb-4">
        <button onClick={saveCurrentQuiz} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-200 mr-2">
          <FontAwesomeIcon icon={faSave} style={{ marginRight: '4px' }} /> Save Quiz
        </button>
        <button onClick={resetQuiz} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition duration-200">
          <FontAwesomeIcon icon={faRedo} style={{ marginRight: '4px' }} /> Reset Quiz
        </button>
      </div>
      {quizQuestions.map((question, index) => (
        <Question
          key={index}
          question={question}
          index={index}
          handleOptionSelect={handleOptionSelect}
        />
      ))}

      {/* Display Quiz Score */}
      {quizScore !== null && (
        <div className="text-center mt-8 mb-4">
          <h2 className="text-2xl font-bold">Quiz Completed!</h2>
          <p className="text-lg mt-2">Your Score: {quizScore}%</p>
        </div>
      )}

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
  );
}

export default QuizDisplay;

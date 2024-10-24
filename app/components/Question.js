// Question.js

import React from 'react';

function Question({ question, index, handleOptionSelect }) {
  return (
    <div key={index} className="question mb-6 p-4 border rounded-lg shadow-md">
      <p className="font-bold mb-2">{question.questionNumber}. {question.question}</p>
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
          {question.answer ? (
            <p className="mt-2">
              {question.isCorrect ? (
                <span className="text-green-600 font-bold">Correct!</span>
              ) : (
                <span className="text-red-600 font-bold">Incorrect!</span>
              )}{' '}
              The correct answer is: <strong>{question.type === 'Multiple Choice' ? question.answer + ')' : ''} {question.options.find(opt => opt.startsWith(question.answer + ')'))?.substring(3) || question.answer}</strong>
            </p>
          ) : (
            <p className="mt-2 text-red-600 font-bold">The correct answer could not be determined.</p>
          )}
          {question.explanation && (
            <p className="mt-2">
              <strong>Explanation:</strong> {question.explanation}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default Question;

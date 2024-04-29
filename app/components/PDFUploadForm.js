// PDFUploadForm.js

import React, { useState } from 'react';

function PDFUploadForm({ onPDFParse }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setError('');
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      setError('Please upload a valid PDF file.');
      setFile(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a PDF file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/chat/pdfparsing', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      onPDFParse(data.text); // Update the parent component's state
      setError('');
    } catch (error) {
      setError('Failed to upload the file. Please try again.');
      console.error('Error uploading file:', error);
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="mb-4">
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker"
            type="file"
            onChange={handleFileChange}
            accept=".pdf"
          />
        </div>
        <div className="mb-4 flex items-center justify-center">
            <button
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
                type="submit"
            >
                Upload PDF
            </button>
        </div>

        
        {error && (
          <div className="text-center text-red-500 text-xs">{error}</div>
        )}
      </form>
    </div>
  );
}

export default PDFUploadForm;

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faLightbulb, faPlay } from '@fortawesome/free-solid-svg-icons';

function PDFUploadForm({ onPDFParse, onPDFProcessed }) {
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setLoaded(true);
    }, []);
    
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
        onPDFParse(data.text);
        onPDFProcessed();  // Trigger after successful text setting
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
              <div className="flex items-center">
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker mr-2 responsive-input"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf"
                />
<button
  className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-2.5 rounded"
  type="submit" style={{ visibility: loaded ? 'visible' : 'hidden' }}
>
<span className="whitespace-nowrap"> <FontAwesomeIcon icon={faFilePdf} /> Use PDF</span>
</button>
              </div>
            </div>
            {error && (
              <div className="text-center text-red-500 text-xs">{error}</div>
            )}
          </form>
        </div>
    );
  }
  
  export default PDFUploadForm;
  
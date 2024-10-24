// LoadingOverlay.js

import React from 'react';

function LoadingOverlay({ isGenerating, loadingTime, chunkProgress }) {
  if (!isGenerating) return null;

  return (
    <div className="loading-overlay fixed inset-0 flex flex-col justify-center items-center bg-white bg-opacity-75 z-40">
      <div className="text-2xl mb-4">Generating Quiz...</div>
      <div className="loading-animation text-xl mb-4">Please wait</div>
      <div className="text-lg">Elapsed Time: {(loadingTime / 1000).toFixed(2)} seconds</div>
      <div className="text-md">Processing chunk {chunkProgress.current} of {chunkProgress.total}</div>
    </div>
  );
}

export default LoadingOverlay;
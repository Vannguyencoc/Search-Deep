
import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Spinner } from './components/Spinner';
import { extractKeyIdeasAndMethodology } from './services/geminiService';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [language, setLanguage] = useState<'EN' | 'VN'>('EN');

  const handleFileChange = useCallback((file: File | null) => {
    setImageFile(file);
    setAnalysisResult('');
    setError('');
  }, []);

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          resolve('');
        }
      };
      reader.readAsDataURL(file);
    });

    const base64EncodedData = await base64EncodedDataPromise;
    return {
      inlineData: {
        data: base64EncodedData,
        mimeType: file.type,
      },
    };
  };

  const handleAnalysis = async () => {
    if (!imageFile) {
      setError('Please upload an image file first.');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnalysisResult('');

    try {
      const filePart = await fileToGenerativePart(imageFile);
      const result = await extractKeyIdeasAndMethodology(filePart, language);
      if(result) {
        setAnalysisResult(result);
      } else {
        setError('Failed to get a valid response from the model.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Analysis failed: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            Document Methodology Extractor
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setLanguage('EN')}
                className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${
                  language === 'EN' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('VN')}
                className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${
                  language === 'VN' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                VN
              </button>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-blue-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 11-2 0V4H6a1 1 0 110-2zm4 7a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 4a1 1 0 100 2h2a1 1 0 100-2H8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">Upload Document</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Select an image or a PDF of a document. The model will analyze it to extract key ideas and methodologies.
            </p>
            <FileUpload onFileChange={handleFileChange} />
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={handleAnalysis}
              disabled={!imageFile || isLoading}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105 disabled:transform-none"
            >
              {isLoading ? 'Analyzing...' : 'Extract Insights'}
            </button>
          </div>

          {isLoading && <Spinner />}
          
          {error && (
            <div className="mt-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          {analysisResult && !isLoading && (
            <ResultsDisplay result={analysisResult} />
          )}

          {!analysisResult && !isLoading && !error && (
            <div className="text-center py-10 px-6 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">Analysis Results Will Appear Here</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Upload a file and click "Extract Insights" to begin.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;

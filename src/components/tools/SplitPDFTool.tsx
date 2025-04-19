import React, { useState, useEffect } from 'react'
import { Document, Page } from 'react-pdf'
import { ScissorsIcon } from '@heroicons/react/24/outline'
import FileUpload from '../FileUpload'
import useFileUpload from '../../hooks/useFileUpload'
import PDFService from '../../services/PDFService'
import '../../utils/PDFUtils' // Import the utility to configure PDF.js worker

const SplitPDFTool: React.FC = () => {
  const {
    files,
    isLoading,
    error,
    handleFileUpload,
    clearFiles,
    removeFile
  } = useFileUpload({ multiple: false });

  const [numPages, setNumPages] = useState<number | null>(null);
  const [splitOptions, setSplitOptions] = useState<'all' | 'range' | 'custom'>('all');
  const [customRanges, setCustomRanges] = useState<string>('');
  const [splitAfterPages, setSplitAfterPages] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Reset when files change
  useEffect(() => {
    setNumPages(null);
    setSplitOptions('all');
    setCustomRanges('');
    setSplitAfterPages([]);
    setSuccess(false);
    setPdfError(null);
  }, [files]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log(`PDF loaded successfully with ${numPages} pages`);
    setNumPages(numPages);
    setPdfError(null);
    
    // Default split after every page if "all" is selected
    if (splitOptions === 'all' && numPages) {
      const splits = Array.from({ length: numPages - 1 }, (_, i) => i + 1);
      setSplitAfterPages(splits);
    }
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setPdfError(`Error loading PDF: ${error.message}`);
  };

  const handleSplitOptionChange = (option: 'all' | 'range' | 'custom') => {
    setSplitOptions(option);
    
    if (option === 'all' && numPages) {
      // Split after every page
      const splits = Array.from({ length: numPages - 1 }, (_, i) => i + 1);
      setSplitAfterPages(splits);
    } else if (option === 'range') {
      // Reset splits
      setSplitAfterPages([]);
    } else {
      // Reset custom ranges
      setCustomRanges('');
      setSplitAfterPages([]);
    }
  };

  const toggleSplitAfterPage = (pageNum: number) => {
    setSplitAfterPages(prev => {
      if (prev.includes(pageNum)) {
        return prev.filter(p => p !== pageNum);
      } else {
        return [...prev, pageNum].sort((a, b) => a - b);
      }
    });
  };

  const handleCustomRangesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomRanges(e.target.value);
  };

  const parseCustomRanges = (): number[] => {
    try {
      // Format examples: "1-3,5,7-9" or "1,2,3,4"
      const ranges = customRanges.split(',').map(range => range.trim());
      const pageNumbers: number[] = [];
      
      for (const range of ranges) {
        if (range.includes('-')) {
          const [start, end] = range.split('-').map(n => parseInt(n.trim()));
          if (isNaN(start) || isNaN(end) || start < 1 || end > (numPages || 0) || start > end) {
            throw new Error(`Invalid range: ${range}`);
          }
          
          // Add all page numbers except the last one in the range
          for (let i = start; i < end; i++) {
            pageNumbers.push(i);
          }
        } else {
          const page = parseInt(range);
          if (isNaN(page) || page < 1 || page >= (numPages || 0)) {
            throw new Error(`Invalid page number: ${range}`);
          }
          pageNumbers.push(page);
        }
      }
      
      return [...new Set(pageNumbers)].sort((a, b) => a - b);
    } catch (error) {
      console.error('Error parsing custom ranges:', error);
      return [];
    }
  };

  const handleSplitPDF = async () => {
    if (files.length !== 1 || !numPages) {
      return;
    }

    setProcessing(true);
    setSuccess(false);

    try {
      let splitPoints: number[] = [];
      
      if (splitOptions === 'all') {
        // Split after every page
        splitPoints = Array.from({ length: numPages - 1 }, (_, i) => i + 1);
      } else if (splitOptions === 'range') {
        // Use manually selected split points
        splitPoints = splitAfterPages;
      } else if (splitOptions === 'custom') {
        // Parse custom ranges
        splitPoints = parseCustomRanges();
      }
      
      await PDFService.splitPDF(files[0], splitPoints);
      setSuccess(true);
    } catch (error) {
      console.error('Error splitting PDF:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Split PDF</h2>
        <p className="text-gray-600 mb-6">
          Divide your PDF document into multiple smaller PDFs.
        </p>

        <FileUpload
          files={files}
          onFileUpload={handleFileUpload}
          onClearFiles={clearFiles}
          onRemoveFile={removeFile}
          loading={isLoading}
          error={error}
        />

        {files.length > 0 && !isLoading && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Split Options</h3>
            </div>
            
            <div className="border border-gray-200 rounded-md p-4">
              {pdfError ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                  <h4 className="font-medium mb-2">PDF Loading Error</h4>
                  <p>{pdfError}</p>
                  <p className="text-sm mt-2">
                    Try using a different PDF file or check if the file is corrupted.
                  </p>
                </div>
              ) : (
                <div>
                  <Document
                    file={files[0]?.data}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex justify-center items-center p-4">
                        <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    }
                  >
                    {numPages && (
                      <div className="space-y-4">
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="split-all"
                              name="split-option"
                              checked={splitOptions === 'all'}
                              onChange={() => handleSplitOptionChange('all')}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="split-all" className="text-sm font-medium text-gray-700">
                              Split after each page (Extract all pages)
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="split-range"
                              name="split-option"
                              checked={splitOptions === 'range'}
                              onChange={() => handleSplitOptionChange('range')}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="split-range" className="text-sm font-medium text-gray-700">
                              Select pages to split after
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="split-custom"
                              name="split-option"
                              checked={splitOptions === 'custom'}
                              onChange={() => handleSplitOptionChange('custom')}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="split-custom" className="text-sm font-medium text-gray-700">
                              Custom split pattern
                            </label>
                          </div>
                        </div>
                        
                        {splitOptions === 'range' && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">
                              Select the pages after which you want to split the PDF:
                            </p>
                            <div className="grid grid-cols-8 gap-2">
                              {Array.from({ length: numPages - 1 }, (_, i) => i + 1).map(pageNum => (
                                <button
                                  key={pageNum}
                                  type="button"
                                  onClick={() => toggleSplitAfterPage(pageNum)}
                                  className={`p-2 rounded-md text-center text-sm ${
                                    splitAfterPages.includes(pageNum)
                                      ? 'bg-primary-100 text-primary-800 border border-primary-300'
                                      : 'bg-gray-100 text-gray-800 border border-gray-300'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              {splitAfterPages.length > 0
                                ? `Will split after pages: ${splitAfterPages.join(', ')}`
                                : 'No split points selected'}
                            </p>
                          </div>
                        )}
                        
                        {splitOptions === 'custom' && (
                          <div className="mt-4">
                            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-3">
                              <h4 className="text-sm font-medium text-blue-700 mb-1">How to use the custom split pattern:</h4>
                              <ul className="text-xs text-blue-600 list-disc pl-4 space-y-1">
                                <li>Use page numbers to split after specific pages (e.g., "3,8,11")</li>
                                <li>Use ranges to split at the end of each range (e.g., "1-3,5-9")</li>
                                <li>Combine both formats (e.g., "1-3,5,7-9")</li>
                              </ul>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <label htmlFor="custom-ranges" className="text-sm font-medium text-gray-700">
                                Enter your split pattern:
                              </label>
                              <textarea
                                id="custom-ranges"
                                value={customRanges}
                                onChange={handleCustomRangesChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                rows={2}
                                placeholder="Example: 1-3,5,7-9"
                              />
                            </div>
                            <div className="mt-2 flex items-center">
                              <div className="flex-shrink-0 text-primary-500 mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                </svg>
                              </div>
                              <p className="text-xs text-gray-600">
                                This will create separate PDF files based on your pattern.
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-6 p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <ScissorsIcon className="h-6 w-6 text-primary-500" />
                            </div>
                            <div className="flex-grow">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Total pages:</span> {numPages}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Result:</span> Will create{' '}
                                {splitOptions === 'all'
                                  ? numPages
                                  : splitOptions === 'range'
                                    ? splitAfterPages.length + 1
                                    : parseCustomRanges().length + 1}{' '}
                                PDF files
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Document>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={handleSplitPDF}
            disabled={
              files.length !== 1 || 
              !numPages || 
              processing || 
              pdfError !== null || 
              (splitOptions === 'range' && splitAfterPages.length === 0) ||
              (splitOptions === 'custom' && customRanges.trim() === '')
            }
            className={`w-full py-3 px-4 rounded-md font-medium text-white ${
              files.length !== 1 || 
              !numPages || 
              processing || 
              pdfError !== null || 
              (splitOptions === 'range' && splitAfterPages.length === 0) ||
              (splitOptions === 'custom' && customRanges.trim() === '')
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {processing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Split PDF'
            )}
          </button>
        </div>

        {success && (
          <div className="mt-4 p-4 rounded-md bg-green-50 text-green-800">
            PDF has been successfully split and downloaded.
          </div>
        )}
      </div>
    </div>
  );
};

export default SplitPDFTool; 
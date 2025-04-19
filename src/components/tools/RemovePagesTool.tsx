import React, { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { TrashIcon } from '@heroicons/react/24/outline'
import FileUpload from '../FileUpload'
import useFileUpload from '../../hooks/useFileUpload'
import PDFService from '../../services/PDFService'
import '../../utils/PDFUtils' // Import the utility to configure PDF.js worker

const RemovePagesTool: React.FC = () => {
  const {
    files,
    isLoading,
    error,
    handleFileUpload,
    clearFiles,
    removeFile
  } = useFileUpload({ multiple: false });

  const [numPages, setNumPages] = useState<number | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [workerInfo, setWorkerInfo] = useState<string>('');

  // Reset selected pages when files change
  useEffect(() => {
    setSelectedPages([]);
    setSuccess(false);
    setPdfError(null);
  }, [files]);

  // Log PDF.js worker information on mount
  useEffect(() => {
    const workerSrc = pdfjs.GlobalWorkerOptions.workerSrc;
    console.log('PDF.js worker source:', workerSrc);
    setWorkerInfo(`Worker: ${workerSrc}`);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log(`PDF loaded successfully with ${numPages} pages`);
    setNumPages(numPages);
    setPdfError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setPdfError(`Error loading PDF: ${error.message}`);
  };

  const togglePageSelection = (pageIndex: number) => {
    setSelectedPages(prevSelected => {
      if (prevSelected.includes(pageIndex)) {
        return prevSelected.filter(p => p !== pageIndex);
      } else {
        return [...prevSelected, pageIndex];
      }
    });
  };

  const handleRemovePages = async () => {
    if (files.length !== 1 || selectedPages.length === 0) {
      return;
    }

    setProcessing(true);
    setSuccess(false);

    try {
      const resultPdf = await PDFService.removePages(files[0], selectedPages);
      PDFService.downloadPDF(resultPdf, 'document_with_pages_removed.pdf');
      setSuccess(true);
    } catch (error) {
      console.error('Error removing pages from PDF:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSelectAll = () => {
    if (numPages) {
      const allPages = Array.from({ length: numPages }, (_, i) => i);
      setSelectedPages(allPages);
    }
  };

  const handleDeselectAll = () => {
    setSelectedPages([]);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Remove Pages</h2>
        <p className="text-gray-600 mb-6">
          Select and remove unwanted pages from your PDF document.
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
              <h3 className="text-lg font-medium text-gray-900">Select pages to remove</h3>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  Deselect All
                </button>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-md p-4">
              {pdfError ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                  <h4 className="font-medium mb-2">PDF Loading Error</h4>
                  <p>{pdfError}</p>
                  <p className="text-sm mt-2">
                    Try using a different PDF file or check if the file is corrupted.
                  </p>
                  <div className="mt-4 text-xs text-gray-500 border-t border-gray-200 pt-2">
                    <p>Technical details (for debugging):</p>
                    <p className="font-mono overflow-auto">{workerInfo}</p>
                    <p className="font-mono overflow-auto">PDF.js version: {pdfjs.version}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Document
                    file={files[0].data}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    className="w-full"
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {Array.from(new Array(numPages), (_, index) => (
                          <div key={index} className="relative flex flex-col items-center">
                            <button
                              type="button"
                              onClick={() => togglePageSelection(index)}
                              className={`w-full border-2 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                                selectedPages.includes(index) 
                                  ? 'border-red-500 opacity-75' 
                                  : 'border-transparent hover:border-gray-300'
                              }`}
                            >
                              <Page
                                pageNumber={index + 1}
                                width={150}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                loading={
                                  <div className="flex justify-center items-center h-[150px] w-[150px] bg-gray-50">
                                    <svg className="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  </div>
                                }
                                error={
                                  <div className="flex justify-center items-center h-[150px] w-[150px] bg-red-50 text-red-600">
                                    <span className="text-xs text-center">Error loading page</span>
                                  </div>
                                }
                              />
                              {selectedPages.includes(index) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-30">
                                  <TrashIcon className="h-8 w-8 text-red-500" />
                                </div>
                              )}
                            </button>
                            <p className="text-xs text-center mt-2 bg-gray-100 rounded-md px-2 py-1 w-full">
                              Page {index + 1}
                            </p>
                          </div>
                        ))}
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
            onClick={handleRemovePages}
            disabled={files.length !== 1 || selectedPages.length === 0 || processing || pdfError !== null}
            className={`w-full py-3 px-4 rounded-md font-medium text-white ${
              files.length !== 1 || selectedPages.length === 0 || processing || pdfError !== null
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
              `Remove ${selectedPages.length} ${selectedPages.length === 1 ? 'Page' : 'Pages'}`
            )}
          </button>
        </div>

        {success && (
          <div className="mt-4 p-4 rounded-md bg-green-50 text-green-800">
            PDF has been successfully processed and downloaded.
          </div>
        )}
      </div>
    </div>
  );
};

export default RemovePagesTool; 
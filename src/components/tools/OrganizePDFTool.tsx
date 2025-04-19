import React, { useState, useEffect } from 'react'
import { Document, Page } from 'react-pdf'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import FileUpload from '../FileUpload'
import useFileUpload from '../../hooks/useFileUpload'
import PDFService from '../../services/PDFService'
import '../../utils/PDFUtils' // Import the utility to configure PDF.js worker

const OrganizePDFTool: React.FC = () => {
  const {
    files,
    isLoading,
    error,
    handleFileUpload,
    clearFiles,
    removeFile
  } = useFileUpload({ multiple: false });

  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialize page order when PDF is loaded
  useEffect(() => {
    if (numPages) {
      setPageOrder(Array.from({ length: numPages }, (_, i) => i));
      setSuccess(false);
    }
  }, [numPages]);

  // Reset when files change
  useEffect(() => {
    setPageOrder([]);
    setNumPages(null);
    setSuccess(false);
  }, [files]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const movePageUp = (index: number) => {
    if (index === 0) return;
    
    const newOrder = [...pageOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    
    setPageOrder(newOrder);
  };

  const movePageDown = (index: number) => {
    if (index === pageOrder.length - 1) return;
    
    const newOrder = [...pageOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    
    setPageOrder(newOrder);
  };

  const handleOrganizePDF = async () => {
    if (files.length !== 1 || !numPages || pageOrder.length !== numPages) {
      return;
    }

    setProcessing(true);
    setSuccess(false);

    try {
      const resultPdf = await PDFService.organizePDF(files[0], pageOrder);
      PDFService.downloadPDF(resultPdf, 'organized_document.pdf');
      setSuccess(true);
    } catch (error) {
      console.error('Error organizing PDF:', error);
    } finally {
      setProcessing(false);
    }
  };

  const resetOrder = () => {
    if (numPages) {
      setPageOrder(Array.from({ length: numPages }, (_, i) => i));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Organize PDF</h2>
        <p className="text-gray-600 mb-6">
          Rearrange the pages of your PDF document by changing their order.
        </p>

        <FileUpload
          files={files}
          onFileUpload={handleFileUpload}
          onClearFiles={clearFiles}
          onRemoveFile={removeFile}
          loading={isLoading}
          error={error}
        />

        {files.length > 0 && !isLoading && pageOrder.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Rearrange Pages</h3>
              <button
                type="button"
                onClick={resetOrder}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                Reset Order
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-md p-4">
              <div className="grid grid-cols-1 gap-4">
                <Document
                  file={files[0].data}
                  onLoadSuccess={onDocumentLoadSuccess}
                  className="hidden"
                >
                  {/* Hidden document just to load the PDF */}
                  {numPages && <Page pageNumber={1} width={1} />}
                </Document>

                {numPages && pageOrder.map((pageIdx, orderIdx) => (
                  <div key={orderIdx} className="flex items-center p-2 border border-gray-200 rounded-md bg-gray-50">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary-100 rounded-full mr-4">
                      <span className="font-bold text-primary-700">{orderIdx + 1}</span>
                    </div>
                    
                    <div className="flex-grow flex items-center">
                      <span className="text-sm font-medium">Original Page {pageIdx + 1}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => movePageUp(orderIdx)}
                        disabled={orderIdx === 0}
                        className={`p-1 rounded-md ${
                          orderIdx === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'
                        }`}
                        aria-label="Move up"
                      >
                        <ArrowUpIcon className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => movePageDown(orderIdx)}
                        disabled={orderIdx === pageOrder.length - 1}
                        className={`p-1 rounded-md ${
                          orderIdx === pageOrder.length - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'
                        }`}
                        aria-label="Move down"
                      >
                        <ArrowDownIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={handleOrganizePDF}
            disabled={files.length !== 1 || !numPages || pageOrder.length !== numPages || processing}
            className={`w-full py-3 px-4 rounded-md font-medium text-white ${
              files.length !== 1 || !numPages || pageOrder.length !== numPages || processing
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
              'Organize PDF'
            )}
          </button>
        </div>

        {success && (
          <div className="mt-4 p-4 rounded-md bg-green-50 text-green-800">
            PDF has been successfully organized and downloaded.
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizePDFTool; 
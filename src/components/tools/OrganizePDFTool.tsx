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
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

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
    setPdfError(null);
  }, [files]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log(`PDF loaded successfully with ${numPages} pages`);
    setNumPages(numPages);
    setPdfError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setPdfError(`Error loading PDF: ${error.message}`);
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

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDragItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverItem(index);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (dragItem === null || dragOverItem === null || dragItem === dragOverItem) {
      return;
    }
    
    const newOrder = [...pageOrder];
    const draggedItemValue = newOrder[dragItem];
    
    // Remove the dragged item
    newOrder.splice(dragItem, 1);
    // Insert it at the new position
    newOrder.splice(dragOverItem, 0, draggedItemValue);
    
    console.log('Reordering from', dragItem, 'to', dragOverItem, 'New order:', newOrder);
    
    setPageOrder(newOrder);
    setDragItem(null);
    setDragOverItem(null);
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
          Rearrange the pages of your PDF document by dragging and dropping pages or using the arrow buttons.
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
              <h3 className="text-lg font-medium text-gray-900">Rearrange Pages</h3>
              {pageOrder.length > 0 && (
                <div className="space-x-3">
                  <button
                    type="button"
                    onClick={resetOrder}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    Reset Order
                  </button>
                </div>
              )}
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
                  {numPages && pageOrder.length > 0 && (
                    <div className="mb-3 p-3 bg-primary-50 border border-primary-100 rounded-md text-sm text-primary-800">
                      <p><strong>Tip:</strong> Drag and drop pages to reorder them, or use the arrow buttons to move pages up and down.</p>
                    </div>
                  )}

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
                    {numPages && pageOrder.length > 0 && (
                      <div className="space-y-3">
                        {pageOrder.map((pageIdx, orderIdx) => (
                          <div
                            key={orderIdx}
                            draggable
                            onDragStart={() => handleDragStart(orderIdx)}
                            onDragOver={(e) => handleDragOver(e, orderIdx)}
                            onDrop={handleDrop}
                            className={`flex items-center p-3 border ${dragOverItem === orderIdx ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-gray-50'} rounded-md hover:bg-gray-100 transition-all cursor-grab active:cursor-grabbing`}
                          >
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary-100 rounded-full mr-4">
                              <span className="font-bold text-primary-700">{orderIdx + 1}</span>
                            </div>
                            
                            <div className="flex-shrink-0 mr-4 border border-gray-300 rounded-md overflow-hidden bg-white">
                              <Page
                                pageNumber={pageIdx + 1}
                                width={80}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                loading={
                                  <div className="flex justify-center items-center h-[100px] w-[80px] bg-gray-50">
                                    <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  </div>
                                }
                                error={
                                  <div className="flex justify-center items-center h-[100px] w-[80px] bg-red-50 text-red-600">
                                    <span className="text-xs text-center">Error</span>
                                  </div>
                                }
                              />
                            </div>
                            
                            <div className="flex-grow flex items-center">
                              <div>
                                <div className="text-sm font-medium">Original Page {pageIdx + 1}</div>
                                <div className="text-xs text-gray-500">Now at position {orderIdx + 1}</div>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => movePageUp(orderIdx)}
                                disabled={orderIdx === 0}
                                className={`p-2 rounded-md ${
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
                                className={`p-2 rounded-md ${
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
            onClick={handleOrganizePDF}
            disabled={files.length !== 1 || !numPages || pageOrder.length !== numPages || processing || pdfError !== null}
            className={`w-full py-3 px-4 rounded-md font-medium text-white ${
              files.length !== 1 || !numPages || pageOrder.length !== numPages || processing || pdfError !== null
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
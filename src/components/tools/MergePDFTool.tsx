import React, { useState } from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import FileUpload from '../FileUpload'
import useFileUpload from '../../hooks/useFileUpload'
import PDFService from '../../services/PDFService'

const MergePDFTool: React.FC = () => {
  const {
    files,
    isLoading,
    error,
    handleFileUpload,
    clearFiles,
    removeFile,
    multiple
  } = useFileUpload({ multiple: true });

  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragItem, setDragItem] = useState<number | null>(null);

  // Maintain manual order of files separate from the actual files array
  React.useEffect(() => {
    setPageOrder(files.map((_, index) => index));
  }, [files.length]);

  const handleMergePDFs = async () => {
    if (files.length < 2) {
      return;
    }

    setProcessing(true);
    setSuccess(false);

    try {
      // Use the pageOrder to reorder files before merging
      const orderedFiles = pageOrder.map(index => files[index]);
      const mergedPdf = await PDFService.mergePDFs(orderedFiles);
      PDFService.downloadPDF(mergedPdf, 'merged_document.pdf');
      setSuccess(true);
    } catch (error) {
      console.error('Error merging PDFs:', error);
    } finally {
      setProcessing(false);
    }
  };

  const moveFileUp = (index: number) => {
    if (index === 0) return;
    
    const newOrder = [...pageOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    
    setPageOrder(newOrder);
  };

  const moveFileDown = (index: number) => {
    if (index === pageOrder.length - 1) return;
    
    const newOrder = [...pageOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    
    setPageOrder(newOrder);
  };

  const handleDragStart = (index: number) => {
    setDragItem(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, dropIndex: number) => {
    e.preventDefault();
    
    if (dragItem === null || dragItem === dropIndex) return;
    
    const newOrder = [...pageOrder];
    const draggedItem = newOrder[dragItem];
    
    // Remove the dragged item
    newOrder.splice(dragItem, 1);
    // Insert it at the drop position
    newOrder.splice(dropIndex, 0, draggedItem);
    
    setPageOrder(newOrder);
    setDragItem(null);
  };

  const handleDragEnd = () => {
    setDragItem(null);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Merge PDF</h2>
        <p className="text-gray-600 mb-6">
          Combine multiple PDF files into a single document. Upload two or more PDFs and arrange them in the desired order.
        </p>

        <FileUpload
          files={files}
          onFileUpload={handleFileUpload}
          onClearFiles={clearFiles}
          onRemoveFile={removeFile}
          multiple={multiple}
          loading={isLoading}
          error={error}
        />

        {files.length >= 2 && (
          <div className="mt-6 border border-gray-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Arrange Files</h3>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop to reorder files, or use the arrows. Files will be merged in the order shown below.
            </p>

            <ul className="space-y-2">
              {pageOrder.map((fileIndex, orderIndex) => (
                <li
                  key={orderIndex}
                  draggable
                  onDragStart={() => handleDragStart(orderIndex)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, orderIndex)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-2 border border-gray-200 rounded-md ${
                    dragItem === orderIndex ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
                  } cursor-move`}
                >
                  <span className="flex-1 truncate pl-2">{files[fileIndex]?.name}</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => moveFileUp(orderIndex)}
                      disabled={orderIndex === 0}
                      className={`p-1 rounded-md ${
                        orderIndex === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'
                      }`}
                      aria-label="Move up"
                    >
                      <ArrowUpIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFileDown(orderIndex)}
                      disabled={orderIndex === pageOrder.length - 1}
                      className={`p-1 rounded-md ${
                        orderIndex === pageOrder.length - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'
                      }`}
                      aria-label="Move down"
                    >
                      <ArrowDownIcon className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={handleMergePDFs}
            disabled={files.length < 2 || processing}
            className={`w-full py-3 px-4 rounded-md font-medium text-white ${
              files.length < 2 || processing
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
              'Merge PDFs'
            )}
          </button>
        </div>

        {success && (
          <div className="mt-4 p-4 rounded-md bg-green-50 text-green-800">
            PDFs have been successfully merged and downloaded.
          </div>
        )}
      </div>
    </div>
  )
}

export default MergePDFTool 
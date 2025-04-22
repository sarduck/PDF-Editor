import React, { useState, useEffect } from 'react'
import { Document, Page } from 'react-pdf'
import { DocumentChartBarIcon } from '@heroicons/react/24/outline'
import FileUpload from '../FileUpload'
import useFileUpload from '../../hooks/useFileUpload'
import PDFService from '../../services/PDFService'
import '../../utils/PDFUtils' // Import the utility to configure PDF.js worker

type CompressionLevel = 'low' | 'medium' | 'high' | 'extreme';

interface CompressionOption {
  id: CompressionLevel;
  label: string;
  description: string;
  reduction: string;
  qualityText: string;
}

const compressionOptions: CompressionOption[] = [
  {
    id: 'low',
    label: 'Low Compression',
    description: 'Minimal file size reduction with excellent quality',
    reduction: '20-30%',
    qualityText: 'Perfect for presentations and high-quality printing'
  },
  {
    id: 'medium',
    label: 'Medium Compression',
    description: 'Balanced compression with good quality',
    reduction: '40-60%',
    qualityText: 'Ideal for most documents and web sharing'
  },
  {
    id: 'high',
    label: 'High Compression',
    description: 'Significant file size reduction with acceptable quality',
    reduction: '70-80%',
    qualityText: 'Good for email attachments and storage'
  },
  {
    id: 'extreme',
    label: 'Extreme Compression',
    description: 'Maximum compression with reduced quality',
    reduction: '80-95%',
    qualityText: 'Best for archiving or when file size is critical'
  }
];

const CompressPDFTool: React.FC = () => {
  const {
    files,
    isLoading,
    error,
    handleFileUpload,
    clearFiles,
    removeFile
  } = useFileUpload({ multiple: false });

  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('medium');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [compressionResult, setCompressionResult] = useState<{
    originalSize: number;
    compressedSize: number;
    reduction: number;
  } | null>(null);

  // Reset when files change
  useEffect(() => {
    setNumPages(null);
    setPdfError(null);
    setSuccess(false);
    setCompressionResult(null);
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

  const handleCompressionLevelChange = (level: CompressionLevel) => {
    setCompressionLevel(level);
  };

  const handleCompressPDF = async () => {
    if (files.length !== 1) {
      return;
    }

    setProcessing(true);
    setSuccess(false);
    setCompressionResult(null);
    setPdfError(null);

    try {
      const originalSize = files[0].size;
      console.log(`Starting compression of ${formatFileSize(originalSize)} file with ${compressionLevel} level`);
      
      // Display a message about compression taking time for large files
      if (originalSize > 10 * 1024 * 1024) { // 10MB
        setPdfError("Compressing a large PDF file. This may take some time...");
      }
      
      // Additional warning for extreme compression
      if (compressionLevel === 'extreme' || compressionLevel === 'high') {
        setPdfError("Using high compression - this converts your PDF pages to images which may change text quality but reduces file size significantly.");
      }
      
      // Process the PDF with the selected compression level
      const result = await PDFService.compressPDF(files[0], compressionLevel);
      
      const compressedSize = result.byteLength;
      const reduction = ((originalSize - compressedSize) / originalSize) * 100;
      
      console.log(`Compression complete: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (${reduction.toFixed(1)}% reduction)`);
      
      setCompressionResult({
        originalSize,
        compressedSize,
        reduction
      });
      
      setPdfError(null);
      
      // Only download automatically if there was meaningful compression (>5%)
      if (reduction > 5) {
        PDFService.downloadPDF(result, `compressed_${files[0].name}`);
        setSuccess(true);
      } else {
        // If reduction was minimal, show a warning but still allow download
        setPdfError("The file could not be compressed significantly. This PDF may already be well-optimized.");
        setSuccess(true); // Still consider it a success, just with a warning
      }
    } catch (error) {
      console.error('Error compressing PDF:', error);
      setPdfError('Failed to compress PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return bytes + ' bytes';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Compress PDF</h2>
        <p className="text-gray-600 mb-6">
          Reduce your PDF file size with various compression levels to find the perfect balance between quality and size.
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
              <h3 className="text-lg font-medium text-gray-900">Compression Options</h3>
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
                      <div className="mb-4 grid grid-cols-4 gap-2">
                        <div className="col-span-1">
                          <div className="bg-gray-100 p-4 rounded-md flex justify-center items-center">
                            <Page
                              pageNumber={1}
                              width={150}
                              renderTextLayer={false}
                              renderAnnotationLayer={false}
                              className="border border-gray-200 shadow-sm"
                            />
                          </div>
                        </div>
                        <div className="col-span-3">
                          <div className="bg-blue-50 p-3 rounded-md mb-3 border border-blue-100">
                            <div className="flex items-start space-x-2">
                              <div className="p-1">
                                <DocumentChartBarIcon className="h-5 w-5 text-blue-500" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-blue-700">PDF Information</h4>
                                <p className="text-xs text-blue-600 mt-1">
                                  Pages: {numPages} | 
                                  Original size: {formatFileSize(files[0].size)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 mb-2">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Select compression level:</h4>
                            
                            <div className="grid gap-3">
                              {compressionOptions.map(option => (
                                <div
                                  key={option.id}
                                  className={`border rounded-md p-3 cursor-pointer transition-colors ${
                                    compressionLevel === option.id 
                                      ? 'border-primary-500 bg-primary-50' 
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  onClick={() => handleCompressionLevelChange(option.id)}
                                >
                                  <div className="flex items-center">
                                    <div className={`h-4 w-4 rounded-full mr-3 ${
                                      compressionLevel === option.id 
                                        ? 'bg-primary-500' 
                                        : 'bg-gray-200'
                                    }`}></div>
                                    <div>
                                      <h5 className={`text-sm font-medium ${
                                        compressionLevel === option.id 
                                          ? 'text-primary-800' 
                                          : 'text-gray-700'
                                      }`}>{option.label}</h5>
                                      <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                                      <div className="flex space-x-6 mt-1">
                                        <span className="text-xs text-gray-500">
                                          <span className="font-medium">Size reduction:</span> {option.reduction}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          <span className="font-medium">Quality:</span> {option.qualityText}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
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
            onClick={handleCompressPDF}
            disabled={files.length !== 1 || processing}
            className={`w-full py-3 px-4 rounded-md font-medium text-white ${
              files.length !== 1 || processing
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
                Compressing...
              </span>
            ) : (
              `Compress PDF with ${compressionOptions.find(option => option.id === compressionLevel)?.label}`
            )}
          </button>
        </div>

        {success && compressionResult && (
          <div className="mt-4 p-4 rounded-md bg-green-50 text-green-800">
            <h4 className="text-green-800 font-medium mb-2">PDF Successfully Compressed!</h4>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div className="text-center">
                <p className="text-xs text-green-700">Original Size</p>
                <p className="font-medium">{formatFileSize(compressionResult.originalSize)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-green-700">Compressed Size</p>
                <p className="font-medium">{formatFileSize(compressionResult.compressedSize)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-green-700">Reduction</p>
                <p className="font-medium">{compressionResult.reduction.toFixed(1)}%</p>
              </div>
            </div>
            {compressionResult.reduction < 10 && (
              <div className="mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                <p className="font-medium">Low compression achieved</p>
                <p>This PDF may already be compressed or contain optimized content. Try a higher compression level for better results.</p>
              </div>
            )}
            {compressionResult.reduction >= 70 && (
              <div className="mt-3 text-xs text-green-600 bg-green-50 p-2 rounded border border-green-100">
                <p className="font-medium">Excellent compression achieved!</p>
                <p>The file size was significantly reduced while preserving content.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompressPDFTool; 
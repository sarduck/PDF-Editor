import React, { useRef } from 'react'
import { DocumentArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { PDFFile } from '../services/PDFService'

interface FileUploadProps {
  files: PDFFile[];
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFiles?: () => void;
  onRemoveFile?: (index: number) => void;
  acceptTypes?: string;
  multiple?: boolean;
  loading?: boolean;
  error?: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({
  files,
  onFileUpload,
  onClearFiles,
  onRemoveFile,
  acceptTypes = "application/pdf",
  multiple = false,
  loading = false,
  error = null
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
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
    <div className="w-full">
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          <DocumentArrowUpIcon 
            className="mx-auto h-12 w-12 text-gray-400" 
            aria-hidden="true" 
          />
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500"
            >
              <span onClick={handleButtonClick}>Upload a file</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                ref={fileInputRef}
                className="sr-only"
                accept={acceptTypes}
                multiple={multiple}
                onChange={onFileUpload}
                disabled={loading}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PDF files up to 100MB</p>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}

      {loading && (
        <div className="mt-4 flex justify-center">
          <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700">Uploaded files:</h4>
          <ul className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-200">
            {files.map((file, index) => (
              <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                <div className="w-0 flex-1 flex items-center">
                  <DocumentArrowUpIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                  <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                </div>
                <div className="ml-4 flex-shrink-0 flex items-center">
                  <span className="font-medium text-gray-500 mr-4">{formatFileSize(file.size)}</span>
                  {onRemoveFile && (
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => onRemoveFile(index)}
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {onClearFiles && files.length > 0 && (
            <button
              type="button"
              onClick={onClearFiles}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
            >
              Clear all files
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload; 
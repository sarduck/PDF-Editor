import { useState, useCallback } from 'react'
import { PDFFile } from '../services/PDFService'

interface UseFileUploadOptions {
  multiple?: boolean;
  acceptTypes?: string;
  maxSize?: number; // in bytes
}

const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const { multiple = false, acceptTypes = "application/pdf", maxSize = 100 * 1024 * 1024 } = options;

  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback((fileList: FileList) => {
    if (!fileList || fileList.length === 0) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const uploadedFiles: PDFFile[] = [];
    const fileReaders: Promise<void>[] = [];
    let hasError = false;
    
    Array.from(fileList).forEach((file) => {
      // Check if file type is accepted
      if (!file.type.includes('pdf')) {
        setError("Only PDF files are accepted");
        hasError = true;
        return;
      }
      
      // Check file size
      if (file.size > maxSize) {
        setError(`File size exceeds the maximum allowed size (${maxSize / (1024 * 1024)}MB)`);
        hasError = true;
        return;
      }
      
      const reader = new FileReader();
      
      const readerPromise = new Promise<void>((resolve) => {
        reader.onload = () => {
          if (reader.result) {
            uploadedFiles.push({
              name: file.name,
              size: file.size,
              data: reader.result as ArrayBuffer
            });
          }
          resolve();
        };
        
        reader.onerror = () => {
          setError("Error reading file: " + file.name);
          hasError = true;
          resolve();
        };
      });
      
      fileReaders.push(readerPromise);
      reader.readAsArrayBuffer(file);
    });
    
    Promise.all(fileReaders)
      .then(() => {
        if (!hasError) {
          if (multiple) {
            setFiles((prevFiles) => [...prevFiles, ...uploadedFiles]);
          } else {
            setFiles(uploadedFiles);
          }
        }
      })
      .catch((err) => {
        setError("Error reading files");
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [multiple, maxSize]);

  const handleFileUpload = useCallback((fileList: FileList) => {
    processFiles(fileList);
  }, [processFiles]);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  return {
    files,
    isLoading,
    error,
    handleFileUpload,
    clearFiles,
    removeFile,
    acceptTypes,
    multiple
  };
};

export default useFileUpload; 
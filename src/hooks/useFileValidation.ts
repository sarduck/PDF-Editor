import { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { PDFFile } from '../services/PDFService';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface UseFileValidationOptions {
  maxSize?: number; // in bytes
  minPages?: number;
  maxPages?: number;
  allowEncrypted?: boolean;
}

const useFileValidation = (options: UseFileValidationOptions = {}) => {
  const {
    maxSize = 100 * 1024 * 1024, // 100MB default
    minPages = 1,
    maxPages = 1000,
    allowEncrypted = false
  } = options;

  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });
  
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const validatePDF = useCallback(async (file: PDFFile): Promise<ValidationResult> => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check file size
    if (file.size > maxSize) {
      result.errors.push(`File size exceeds the maximum allowed size (${Math.round(maxSize / (1024 * 1024))}MB)`);
      result.isValid = false;
    }

    try {
      // Check if the file is a valid PDF
      const pdfDoc = await PDFDocument.load(file.data, { 
        ignoreEncryption: allowEncrypted 
      }).catch(error => {
        throw new Error(`Invalid PDF format: ${error.message}`);
      });

      // Check if PDF is encrypted
      if (pdfDoc.isEncrypted && !allowEncrypted) {
        result.errors.push('Encrypted PDFs are not supported');
        result.isValid = false;
      }

      // Check page count
      const pageCount = pdfDoc.getPageCount();
      if (pageCount < minPages) {
        result.errors.push(`PDF must have at least ${minPages} page(s)`);
        result.isValid = false;
      }
      
      if (pageCount > maxPages) {
        result.errors.push(`PDF exceeds maximum allowed pages (${maxPages})`);
        result.isValid = false;
      }

      // Check if PDF has no pages (corrupt)
      if (pageCount === 0) {
        result.errors.push('PDF file appears to be corrupt (zero pages)');
        result.isValid = false;
      }

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error validating PDF');
      result.isValid = false;
    }

    return result;
  }, [maxSize, minPages, maxPages, allowEncrypted]);

  const validateFiles = useCallback(async (files: PDFFile[]): Promise<boolean> => {
    if (!files || files.length === 0) {
      return true;
    }
    
    setIsValidating(true);
    
    try {
      // Validate each file
      for (const file of files) {
        const result = await validatePDF(file);
        
        if (!result.isValid) {
          setValidationResult(result);
          setIsValidating(false);
          return false;
        }
        
        if (result.warnings.length > 0) {
          setValidationResult(result);
        }
      }
      
      setValidationResult({
        isValid: true,
        errors: [],
        warnings: []
      });
      
      return true;
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
        warnings: []
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [validatePDF]);

  const clearValidation = useCallback(() => {
    setValidationResult({
      isValid: true,
      errors: [],
      warnings: []
    });
  }, []);

  return {
    validationResult,
    isValidating,
    validateFiles,
    validatePDF,
    clearValidation
  };
};

export default useFileValidation; 
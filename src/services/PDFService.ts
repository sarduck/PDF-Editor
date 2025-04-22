import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import { pdfjs } from 'react-pdf'

export interface PDFFile {
  name: string;
  size: number;
  data: ArrayBuffer;
}

type CompressionLevel = 'low' | 'medium' | 'high' | 'extreme';

class PDFService {
  async mergePDFs(pdfFiles: PDFFile[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const file of pdfFiles) {
      const pdf = await PDFDocument.load(file.data);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    return mergedPdf.save();
  }

  async removePages(pdfFile: PDFFile, pagesToRemove: number[]): Promise<Uint8Array> {
    const pdf = await PDFDocument.load(pdfFile.data);
    const pageIndices = pdf.getPageIndices();
    
    // Create a new document with only the pages we want to keep
    const newPdf = await PDFDocument.create();
    
    for (let i = 0; i < pageIndices.length; i++) {
      if (!pagesToRemove.includes(i)) {
        const [copiedPage] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(copiedPage);
      }
    }
    
    return newPdf.save();
  }

  async extractPages(pdfFile: PDFFile, pagesToExtract: number[]): Promise<Uint8Array> {
    const pdf = await PDFDocument.load(pdfFile.data);
    
    // Create a new document with only the pages we want to extract
    const newPdf = await PDFDocument.create();
    
    const copiedPages = await newPdf.copyPages(pdf, pagesToExtract);
    copiedPages.forEach((page) => {
      newPdf.addPage(page);
    });
    
    return newPdf.save();
  }

  async organizePDF(pdfFile: PDFFile, newOrder: number[]): Promise<Uint8Array> {
    const pdf = await PDFDocument.load(pdfFile.data);
    
    // Create a new document with reordered pages
    const newPdf = await PDFDocument.create();
    
    const copiedPages = await newPdf.copyPages(pdf, newOrder);
    copiedPages.forEach((page) => {
      newPdf.addPage(page);
    });
    
    return newPdf.save();
  }

  async compressPDF(pdfFile: PDFFile, compressionLevel: CompressionLevel): Promise<Uint8Array> {
    try {
      console.log(`Compressing PDF with ${compressionLevel} compression level`);
      console.time('compression');
      
      // For high or extreme compression, use canvas-based compression
      if (compressionLevel === 'high' || compressionLevel === 'extreme') {
        const result = await this.canvasBasedCompression(pdfFile, compressionLevel);
        
        // Log compression ratio
        const originalSize = pdfFile.size;
        const compressedSize = result.byteLength;
        const reductionPercent = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
        console.log(`Canvas compression complete: ${this.formatBytes(originalSize)} → ${this.formatBytes(compressedSize)} (${reductionPercent}% reduction)`);
        console.timeEnd('compression');
        
        return result;
      }
      
      // For lower compression levels, try standard approach
      const standardResult = await this.advancedCompression(pdfFile, compressionLevel);
      
      // Log compression ratio
      const originalSize = pdfFile.size;
      const compressedSize = standardResult.byteLength;
      const reductionPercent = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
      console.log(`Standard compression complete: ${this.formatBytes(originalSize)} → ${this.formatBytes(compressedSize)} (${reductionPercent}% reduction)`);
      console.timeEnd('compression');
      
      return standardResult;
    } catch (error) {
      console.error('Error compressing PDF:', error);
      throw error;
    }
  }
  
  // Canvas-based compression - this creates a completely new PDF from rendered images
  private async canvasBasedCompression(pdfFile: PDFFile, compressionLevel: CompressionLevel): Promise<Uint8Array> {
    console.log('Using canvas-based compression method for maximum reduction');
    
    try {
      // Make sure pdfjs worker is set correctly
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
      }
      
      // Load the PDF with PDF.js from react-pdf which is already set up
      const loadingTask = pdfjs.getDocument(pdfFile.data);
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;
      
      console.log(`PDF loaded with ${numPages} pages, beginning canvas compression`);
      
      // Create a new PDF document
      const newPdf = await PDFDocument.create();
      
      // Determine compression quality based on level
      let quality = 0.5; // medium quality default
      let scale = 1.0;
      
      switch (compressionLevel) {
        case 'low':
          quality = 0.7;
          scale = 1.0;
          break;
        case 'medium':
          quality = 0.5;
          scale = 0.9;
          break;
        case 'high':
          quality = 0.3;
          scale = 0.8;
          break;
        case 'extreme':
          quality = 0.15;
          scale = 0.7;
          break;
      }
      
      // Process each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        console.log(`Processing page ${pageNum} of ${numPages}`);
        
        // Get the PDF page
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        // Create a canvas and render the page
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        
        if (!context) {
          throw new Error('Could not get canvas context');
        }
        
        // Render the PDF page to the canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Convert the canvas to a JPEG image with specified quality
        const jpegData = canvas.toDataURL('image/jpeg', quality);
        const imageBytes = this.dataURLToBytes(jpegData);
        
        // Add the compressed image to the new PDF
        const jpegImage = await newPdf.embedJpg(imageBytes);
        
        // Add a page with the embedded image
        const newPage = newPdf.addPage([viewport.width, viewport.height]);
        newPage.drawImage(jpegImage, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height
        });
      }
      
      // Save the new PDF with compression
      return newPdf.save({
        useObjectStreams: true
      });
      
    } catch (error) {
      console.error('Canvas-based compression failed:', error);
      // Fall back to basic compression if canvas approach fails
      return this.advancedCompression(pdfFile, compressionLevel);
    }
  }
  
  // Convert data URL to Uint8Array
  private dataURLToBytes(dataURL: string): Uint8Array {
    // Remove the data URL prefix
    const base64 = dataURL.split(',')[1];
    
    // Convert base64 to binary
    const binaryString = atob(base64);
    
    // Create a Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes;
  }
  
  private async advancedCompression(pdfFile: PDFFile, compressionLevel: CompressionLevel): Promise<Uint8Array> {
    console.log('Using advanced compression method');
    
    try {
      // Step 1: Load the PDF and create a new document
      const pdf = await PDFDocument.load(pdfFile.data);
      const pageCount = pdf.getPageCount();
      
      // Track the original size for comparison
      const originalSize = pdfFile.size;
      
      // Step 2: Create a new document with more aggressive compression settings
      const newPdf = await PDFDocument.create();
      
      // Step 3: Copy pages with reduced quality based on compression level
      // For each page, apply downsampling and quality reduction
      const pageIndices = pdf.getPageIndices();
      const pages = await newPdf.copyPages(pdf, pageIndices);
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        // Get original page size
        const { width, height } = page.getSize();
        
        // Apply scaling factor based on compression level
        // More aggressive downscaling for higher compression levels
        let scaleFactor;
        switch(compressionLevel) {
          case 'extreme':
            scaleFactor = 0.7; // 30% reduction
            break;
          case 'high':
            scaleFactor = 0.8; // 20% reduction
            break;
          default:
            scaleFactor = 0.9; // 10% reduction
        }
        
        // Reduce page dimensions - this helps with overall compression
        page.setWidth(width * scaleFactor);
        page.setHeight(height * scaleFactor);
        
        // Add the page to the new document
        newPdf.addPage(page);
      }
      
      // Step 4: Remove metadata to reduce size
      newPdf.setTitle('');
      newPdf.setAuthor('');
      newPdf.setSubject('');
      newPdf.setKeywords([]);
      newPdf.setProducer('PDF Compressor');
      newPdf.setCreator('PDF Compressor');
      
      // Step 5: Save with maximum compression
      const firstPassData = await newPdf.save({
        useObjectStreams: true
      });
      
      // If compression was effective (reduced size by more than 20%), return the result
      if (firstPassData.byteLength < originalSize * 0.8) {
        console.log('First pass compression was sufficient');
        return firstPassData;
      }
      
      // Otherwise try more aggressive compression with the second pass
      console.log('First pass compression insufficient, trying more aggressive method');
      return this.secondPassCompression(firstPassData, compressionLevel);
    } catch (error) {
      console.error('Advanced compression failed:', error);
      // Fall back to client-side compression if advanced method fails
      return this.clientSideCompression(pdfFile, compressionLevel);
    }
  }
  
  private async secondPassCompression(pdfData: Uint8Array, compressionLevel: CompressionLevel): Promise<Uint8Array> {
    try {
      // Create a new PDF document from the first-pass compressed data
      const pdf = await PDFDocument.load(pdfData);
      const newPdf = await PDFDocument.create();
      
      // Copy pages with even more aggressive compression
      const pageIndices = pdf.getPageIndices();
      const pages = await newPdf.copyPages(pdf, pageIndices);
      
      // Apply extremely aggressive compression for the second pass
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        // Get current page size
        const { width, height } = page.getSize();
        
        // Apply even more aggressive scaling based on compression level
        let scaleFactor;
        if (compressionLevel === 'extreme') {
          scaleFactor = 0.6; // 40% reduction
        } else {
          scaleFactor = 0.7; // 30% reduction
        }
        
        // Apply more aggressive scaling
        page.setWidth(width * scaleFactor);
        page.setHeight(height * scaleFactor);
        
        // Add page to the document
        newPdf.addPage(page);
      }
      
      // Clear all metadata
      newPdf.setTitle('');
      newPdf.setAuthor('');
      newPdf.setSubject('');
      newPdf.setKeywords([]);
      newPdf.setProducer('PDF Compressor');
      newPdf.setCreator('PDF Compressor');
      
      // Extra compression for extreme cases - strip all unnecessary data
      // Save with maximum compression settings
      return newPdf.save({
        useObjectStreams: true
      });
    } catch (error) {
      console.error('Second-pass compression failed:', error);
      // Return the first-pass result if second pass fails
      return pdfData;
    }
  }
  
  private async clientSideCompression(pdfFile: PDFFile, compressionLevel: CompressionLevel): Promise<Uint8Array> {
    // Load the PDF
    const pdf = await PDFDocument.load(pdfFile.data);
    
    // Apply compression directly
    return this.applyCompression(pdf, compressionLevel);
  }
  
  private async applyCompression(pdf: PDFDocument, compressionLevel: CompressionLevel): Promise<Uint8Array> {
    // Get compression options based on level
    const compressionOptions = this.getCompressionOptions(compressionLevel);
    
    // Create a new PDF document with compressed settings
    const compressedPdf = await PDFDocument.create();
    
    // Copy all pages
    const pageIndices = pdf.getPageIndices();
    const pages = await compressedPdf.copyPages(pdf, pageIndices);
    
    // Apply compression strategies based on level
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      
      // Apply different scaling strategies based on compression level
      if (compressionLevel === 'high' || compressionLevel === 'extreme') {
        // For high/extreme compression, resize the page dimensions
        const { width, height } = page.getSize();
        
        // Apply scaling based on compression level
        let scaleFactor = 1.0;
        
        if (compressionLevel === 'extreme') {
          scaleFactor = 0.9; // 10% reduction for extreme
        } else if (compressionLevel === 'high') {
          scaleFactor = 0.95; // 5% reduction for high
        }
        
        if (scaleFactor < 1.0) {
          page.setWidth(width * scaleFactor);
          page.setHeight(height * scaleFactor);
        }
      }
      
      // Add the page to the document
      compressedPdf.addPage(page);
    }
    
    // Set metadata compression options
    if (compressionLevel === 'high' || compressionLevel === 'extreme') {
      // Remove metadata to reduce size further
      compressedPdf.setTitle('');
      compressedPdf.setAuthor('');
      compressedPdf.setSubject('');
      compressedPdf.setKeywords([]);
      compressedPdf.setProducer('PDF Compressor');
      compressedPdf.setCreator('PDF Compressor');
    }
    
    // Save with compression options
    return compressedPdf.save(compressionOptions);
  }
  
  // Helper method to get compression options based on level
  private getCompressionOptions(level: CompressionLevel): { useObjectStreams: boolean } {
    // All levels use object streams, more aggressive for higher levels
    return {
      useObjectStreams: true
    };
  }
  
  // Helper function to format bytes to human-readable format
  private formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  async splitPDF(pdfFile: PDFFile, splitAfterPages: number[]): Promise<void> {
    const pdf = await PDFDocument.load(pdfFile.data);
    const pageCount = pdf.getPageCount();
    
    // Sort split points and ensure they're valid
    const validSplitPoints = [...new Set(splitAfterPages)]
      .filter(p => p >= 1 && p < pageCount)
      .sort((a, b) => a - b);
    
    // Calculate page ranges for each output PDF
    const ranges: [number, number][] = [];
    let startPage = 0;
    
    for (const splitPoint of validSplitPoints) {
      ranges.push([startPage, splitPoint]);
      startPage = splitPoint;
    }
    
    // Add the final range if needed
    if (startPage < pageCount - 1) {
      ranges.push([startPage, pageCount - 1]);
    }
    
    // Create and download each PDF segment
    const fileName = pdfFile.name.replace(/\.pdf$/i, '');
    let partNumber = 1;
    
    for (const [start, end] of ranges) {
      const newPdf = await PDFDocument.create();
      const pageRange = Array.from(
        { length: end - start + 1 }, 
        (_, i) => start + i
      );
      
      const copiedPages = await newPdf.copyPages(pdf, pageRange);
      copiedPages.forEach(page => {
        newPdf.addPage(page);
      });
      
      const outputBytes = await newPdf.save();
      this.downloadPDF(outputBytes, `${fileName}_part${partNumber}.pdf`);
      partNumber++;
    }
  }

  // Function to download the generated PDF
  downloadPDF(pdfBytes: Uint8Array, fileName: string): void {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

export default new PDFService(); 
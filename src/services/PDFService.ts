import { PDFDocument } from 'pdf-lib'

export interface PDFFile {
  name: string;
  size: number;
  data: ArrayBuffer;
}

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
import { pdfjs } from 'react-pdf';

// Configure the PDF.js worker
export const configurePDFJS = () => {
  // Only set the worker once and only in the browser
  if (typeof window !== 'undefined') {
    // Use CDN with matching version - API is 2.16.105
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    console.log('PDF.js worker configured with version 2.16.105 to match API version');
  }
};

// Initialize PDF.js
configurePDFJS();

export default {
  configurePDFJS
}; 
import React, { useState } from 'react';
import FileUpload from './FileUpload';
import PDFService, { PDFFile } from '../services/PDFService';
import { Button, Select, SelectItem, Card, CardHeader, CardBody, Divider, Chip } from '@nextui-org/react';
import { formatFileSize } from '../utils/fileUtils';

type CompressionLevel = 'low' | 'medium' | 'high' | 'extreme';

const compressionOptions = [
  { value: 'low', label: 'Low - Better quality, larger file size' },
  { value: 'medium', label: 'Medium - Balanced quality and size' },
  { value: 'high', label: 'High - Smaller file size, lower quality' },
  { value: 'extreme', label: 'Extreme - Smallest file size, lowest quality' },
];

export default function CompressPDFTool() {
  const [pdfFile, setPdfFile] = useState<PDFFile | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('medium');
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [sizeReduction, setSizeReduction] = useState<number | null>(null);

  const handleFileSelected = (file: PDFFile) => {
    setPdfFile(file);
    setCompressedSize(null);
    setSizeReduction(null);
  };

  const handleCompressPDF = async () => {
    if (!pdfFile) return;

    try {
      setIsCompressing(true);
      const compressedPdfBytes = await PDFService.compressPDF(pdfFile, compressionLevel);
      
      // Calculate compressed size and reduction percentage
      const newSize = compressedPdfBytes.byteLength;
      setCompressedSize(newSize);
      
      const reduction = ((pdfFile.size - newSize) / pdfFile.size) * 100;
      setSizeReduction(reduction);
      
      // Download the compressed PDF
      PDFService.downloadPDF(
        compressedPdfBytes, 
        `compressed_${pdfFile.name}`
      );
    } catch (error) {
      console.error('Error compressing PDF:', error);
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="w-full">
        <CardHeader className="flex flex-col items-start gap-1">
          <h2 className="text-xl font-bold">Compress PDF</h2>
          <p className="text-sm text-default-500">
            Reduce the file size of your PDF documents
          </p>
        </CardHeader>
        <Divider />
        <CardBody className="flex flex-col gap-4">
          {!pdfFile ? (
            <FileUpload 
              onFileSelected={handleFileSelected}
              acceptedFileTypes={['.pdf']}
              maxFiles={1}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Chip color="primary" variant="flat">PDF</Chip>
                <span className="font-medium">{pdfFile.name}</span>
                <span className="text-sm text-default-500">
                  ({formatFileSize(pdfFile.size)})
                </span>
                <Button
                  color="danger"
                  variant="light"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setPdfFile(null)}
                >
                  Remove
                </Button>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Compression Level:</label>
                <Select
                  size="sm"
                  value={compressionLevel}
                  onChange={(e) => setCompressionLevel(e.target.value as CompressionLevel)}
                  className="max-w-xs"
                >
                  {compressionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              
              {compressedSize !== null && sizeReduction !== null && (
                <div className="flex flex-col p-3 bg-default-100 rounded-md">
                  <div className="flex justify-between">
                    <span>Original size:</span>
                    <span className="font-medium">{formatFileSize(pdfFile.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Compressed size:</span>
                    <span className="font-medium">{formatFileSize(compressedSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reduction:</span>
                    <span className="font-medium text-success">
                      {sizeReduction.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
              
              <Button
                color="primary"
                className="mt-2"
                isLoading={isCompressing}
                onClick={handleCompressPDF}
              >
                {isCompressing ? 'Compressing...' : 'Compress PDF'}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
} 
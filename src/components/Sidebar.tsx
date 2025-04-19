import React from 'react'
import {
  ArrowsUpDownIcon,
  DocumentArrowDownIcon, 
  DocumentArrowUpIcon,
  DocumentChartBarIcon,
  DocumentDuplicateIcon,
  DocumentMagnifyingGlassIcon,
  DocumentMinusIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  LockClosedIcon,
  LockOpenIcon,
  PencilSquareIcon,
  QueueListIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'

interface SidebarProps {
  setActiveTool: (tool: string) => void
}

interface ToolCategory {
  title: string;
  tools: {
    id: string;
    name: string;
    icon: React.ElementType;
  }[];
}

const Sidebar: React.FC<SidebarProps> = ({ setActiveTool }) => {
  const toolCategories: ToolCategory[] = [
    {
      title: "Organize PDF",
      tools: [
        { id: "merge", name: "Merge PDF", icon: DocumentDuplicateIcon },
        { id: "remove-pages", name: "Remove Pages", icon: DocumentMinusIcon },
        { id: "extract-pages", name: "Extract Pages", icon: DocumentPlusIcon },
        { id: "organize", name: "Organize PDF", icon: QueueListIcon },
      ]
    },
    {
      title: "Convert & Optimize",
      tools: [
        { id: "scan-to-pdf", name: "Scan to PDF", icon: DocumentMagnifyingGlassIcon },
        { id: "compress", name: "Compress PDF", icon: DocumentChartBarIcon },
        { id: "repair", name: "Repair PDF", icon: WrenchScrewdriverIcon },
        { id: "ocr", name: "OCR PDF", icon: DocumentTextIcon },
      ]
    },
    {
      title: "Convert to PDF",
      tools: [
        { id: "jpg-to-pdf", name: "JPG to PDF", icon: DocumentArrowDownIcon },
        { id: "word-to-pdf", name: "WORD to PDF", icon: DocumentArrowDownIcon },
        { id: "ppt-to-pdf", name: "POWERPOINT to PDF", icon: DocumentArrowDownIcon },
        { id: "excel-to-pdf", name: "EXCEL to PDF", icon: DocumentArrowDownIcon },
        { id: "html-to-pdf", name: "HTML to PDF", icon: DocumentArrowDownIcon },
      ]
    },
    {
      title: "Convert from PDF",
      tools: [
        { id: "pdf-to-jpg", name: "PDF to JPG", icon: DocumentArrowUpIcon },
        { id: "pdf-to-word", name: "PDF to WORD", icon: DocumentArrowUpIcon },
        { id: "pdf-to-ppt", name: "PDF to POWERPOINT", icon: DocumentArrowUpIcon },
        { id: "pdf-to-excel", name: "PDF to EXCEL", icon: DocumentArrowUpIcon },
        { id: "pdf-to-pdfa", name: "PDF to PDF/A", icon: DocumentArrowUpIcon },
      ]
    },
    {
      title: "Edit PDF",
      tools: [
        { id: "rotate", name: "Rotate PDF", icon: ArrowsUpDownIcon },
        { id: "add-page-numbers", name: "Add Page Numbers", icon: PencilSquareIcon },
        { id: "add-watermark", name: "Add Watermark", icon: PencilSquareIcon },
        { id: "edit-pdf", name: "Edit PDF", icon: PencilSquareIcon },
      ]
    },
    {
      title: "PDF Security",
      tools: [
        { id: "unlock-pdf", name: "Unlock PDF", icon: LockOpenIcon },
        { id: "protect-pdf", name: "Protect PDF", icon: LockClosedIcon },
        { id: "sign-pdf", name: "Sign PDF", icon: PencilSquareIcon },
        { id: "redact-pdf", name: "Redact PDF", icon: DocumentMinusIcon },
        { id: "compare-pdf", name: "Compare PDF", icon: DocumentMagnifyingGlassIcon },
      ]
    },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-4">PDF Tools</h2>
        <div className="space-y-6">
          {toolCategories.map((category) => (
            <div key={category.title}>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                {category.title}
              </h3>
              <ul className="space-y-1">
                {category.tools.map((tool) => (
                  <li key={tool.id}>
                    <button
                      onClick={() => setActiveTool(tool.id)}
                      className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100 text-left text-gray-700 hover:text-gray-900"
                    >
                      <tool.icon className="h-5 w-5 mr-2 text-gray-500" />
                      {tool.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar 
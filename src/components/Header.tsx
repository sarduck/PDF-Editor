import React from 'react'
import { DocumentIcon } from '@heroicons/react/24/outline'

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DocumentIcon className="h-8 w-8 text-primary-600" />
            <h1 className="ml-2 text-2xl font-bold text-gray-900">PDF Cov</h1>
          </div>
          <div>
            <button className="btn-primary">
              Upload PDF
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 
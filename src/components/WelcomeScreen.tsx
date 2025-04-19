import React from 'react'
import { DocumentIcon } from '@heroicons/react/24/outline'

const WelcomeScreen: React.FC = () => {
  return (
    <div className="text-center max-w-3xl mx-auto py-12">
      <DocumentIcon className="h-24 w-24 text-primary-500 mx-auto" />
      <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
        Welcome to PDF Cov
      </h2>
      <p className="mt-2 text-lg text-gray-600">
        Your all-in-one PDF solution for editing, converting, and managing PDF files.
      </p>
      <div className="mt-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900">Edit PDFs</h3>
            <p className="mt-2 text-sm text-gray-500">
              Modify your PDFs by adding text, images, and annotations.
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900">Convert PDFs</h3>
            <p className="mt-2 text-sm text-gray-500">
              Convert PDFs to and from other file formats like Word, Excel, and images.
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900">Secure PDFs</h3>
            <p className="mt-2 text-sm text-gray-500">
              Protect your PDFs with passwords, encryption, and digital signatures.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <p className="text-base text-gray-500">
          Select a tool from the sidebar to get started.
        </p>
      </div>
    </div>
  )
}

export default WelcomeScreen 
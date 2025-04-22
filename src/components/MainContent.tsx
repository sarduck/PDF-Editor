import React from 'react'
import MergePDFTool from './tools/MergePDFTool'
import RemovePagesTool from './tools/RemovePagesTool'
import ExtractPagesTool from './tools/ExtractPagesTool'
import OrganizePDFTool from './tools/OrganizePDFTool'
import SplitPDFTool from './tools/SplitPDFTool'
import CompressPDFTool from './tools/CompressPDFTool'
import WelcomeScreen from './WelcomeScreen'

interface MainContentProps {
  activeTool: string | null
}

const MainContent: React.FC<MainContentProps> = ({ activeTool }) => {
  const renderTool = () => {
    switch (activeTool) {
      case 'merge':
        return <MergePDFTool />
      case 'split':
        return <SplitPDFTool />
      case 'remove-pages':
        return <RemovePagesTool />
      case 'extract-pages':
        return <ExtractPagesTool />
      case 'organize':
        return <OrganizePDFTool />
      case 'compress':
        return <CompressPDFTool />
      // We'll implement the remaining tools later
      default:
        return <WelcomeScreen />
    }
  }

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      {renderTool()}
    </main>
  )
}

export default MainContent 
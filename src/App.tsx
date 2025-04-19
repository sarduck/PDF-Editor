import { useState } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import './App.css'

function App() {
  const [activeTool, setActiveTool] = useState<string | null>(null)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar setActiveTool={setActiveTool} />
        <MainContent activeTool={activeTool} />
      </div>
    </div>
  )
}

export default App 
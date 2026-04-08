import { useState } from 'react'
import Login, { isAuthenticated } from './components/Login.jsx'
import StockList from './components/StockList.jsx'
import SectorAnalysis from './components/SectorAnalysis.jsx'
import BottomNav from './components/BottomNav.jsx'

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated())
  const [tab, setTab] = useState('list')

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      {tab === 'list' && <StockList />}
      {tab === 'sector' && <SectorAnalysis />}
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}

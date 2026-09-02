import { useState } from 'react'
import Layout from './components/Layout'
import PhanCongCa from './pages/PhanCongCa'
import TonKho from './pages/TonKho'

const pages = { phanCongCa: PhanCongCa, tonKho: TonKho }

export default function App() {
  const [activePage, setActivePage] = useState('phanCongCa')
  const Page = pages[activePage]
  return <Layout activePage={activePage} onNavigate={setActivePage}><Page /></Layout>
}

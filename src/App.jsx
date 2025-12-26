import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import ListaDiaria from './components/ListaDiaria'
import Historial from './components/Historial'
import Resumen from './components/Resumen'
import ResumenPeriodo from './components/ResumenPeriodo'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lista" element={<ListaDiaria />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/resumen" element={<Resumen />} />
        <Route path="/resumen/:periodo" element={<ResumenPeriodo />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

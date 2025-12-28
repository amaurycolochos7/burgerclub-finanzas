import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import Home from './components/Home'
import ListaDiaria from './components/ListaDiaria'
import Historial from './components/Historial'
import Resumen from './components/Resumen'
import ResumenPeriodo from './components/ResumenPeriodo'
import Login from './components/Login'
import CookDashboard from './components/CookDashboard'
import CreateKitchenList from './components/CreateKitchenList'
import MyLists from './components/MyLists'
import PendingLists from './components/PendingLists'
import UserManagement from './components/UserManagement'
import AddSale from './components/AddSale'
import IncomeExpenseHistory from './components/IncomeExpenseHistory'
import DailyTasks from './components/DailyTasks'
import Payroll from './components/Payroll'
import CookPayments from './components/CookPayments'
import Movements from './components/Movements'
import SendNightSales from './components/SendNightSales'
import NightSalesAdmin from './components/NightSalesAdmin'
import InventoryChecklist from './components/InventoryChecklist'
import './index.css'

// Protected route for admin
function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading"><div className="spinner"></div></div>
  if (!user) return <Navigate to="/login" />
  if (user.role !== 'admin') return <Navigate to="/cocina" />

  return children
}

// Protected route for cook
function CookRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading"><div className="spinner"></div></div>
  if (!user) return <Navigate to="/login" />
  if (user.role !== 'cook') return <Navigate to="/" />

  return children
}

// Redirect based on role
function RoleRedirect() {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading"><div className="spinner"></div></div>
  if (!user) return <Navigate to="/login" />
  if (user.role === 'admin') return <Navigate to="/" />
  return <Navigate to="/cocina" />
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Admin routes */}
        <Route path="/" element={<AdminRoute><Home /></AdminRoute>} />
        <Route path="/lista" element={<AdminRoute><ListaDiaria /></AdminRoute>} />
        <Route path="/historial" element={<AdminRoute><Historial /></AdminRoute>} />
        <Route path="/resumen" element={<AdminRoute><Resumen /></AdminRoute>} />
        <Route path="/resumen/:periodo" element={<AdminRoute><ResumenPeriodo /></AdminRoute>} />
        <Route path="/pendientes" element={<AdminRoute><PendingLists /></AdminRoute>} />
        <Route path="/usuarios" element={<AdminRoute><UserManagement /></AdminRoute>} />
        <Route path="/tareas" element={<AdminRoute><DailyTasks /></AdminRoute>} />
        <Route path="/nomina" element={<AdminRoute><Payroll /></AdminRoute>} />
        <Route path="/movimientos" element={<AdminRoute><Movements /></AdminRoute>} />
        <Route path="/envios-dinero" element={<AdminRoute><NightSalesAdmin /></AdminRoute>} />

        {/* Cook routes */}
        <Route path="/cocina" element={<CookRoute><CookDashboard /></CookRoute>} />
        <Route path="/cocina/nueva-lista" element={<CookRoute><CreateKitchenList /></CookRoute>} />
        <Route path="/cocina/mis-listas" element={<CookRoute><MyLists /></CookRoute>} />
        <Route path="/cocina/pagos" element={<CookRoute><CookPayments /></CookRoute>} />
        <Route path="/cocina/ventas-noche" element={<CookRoute><SendNightSales /></CookRoute>} />
        <Route path="/cocina/inventario" element={<CookRoute><InventoryChecklist /></CookRoute>} />

        {/* Fallback */}
        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

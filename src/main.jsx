/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import PrivateRoute from './components/PrivateRoute'
import DashboardLayout from './layouts/DashboardLayout'
import MedicalRecordList from './components/MedicalRecordList'
import RegisterFormPatient from './components/RegisterFormPatient'
import ConsultationForm from './components/ConsultationForm'
import ExamsForm from './components/ExamsForm'
import PatientDetails from './components/PatientDetails'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    element: (
      <PrivateRoute>
        <DashboardLayout />
      </PrivateRoute>
    ),
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/prontuarios', element: <MedicalRecordList /> },
      { path: '/pacientes', element: <RegisterFormPatient /> },
      { path: '/consultas', element: <ConsultationForm /> },
      { path: '/exames', element: <ExamsForm /> },
      { path: '/paciente/:id', element: <PatientDetails /> },
    ],
  },
])

const AppShell = () => {
  const { theme } = useTheme()

  return (
    <>
      <ToastContainer theme={theme} />
      <RouterProvider router={router} />
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)

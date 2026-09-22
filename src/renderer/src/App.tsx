import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { AppLayout } from './components/layout/AppLayout'
import { PageTransition } from './components/common/PageTransition'
import { Dashboard } from './pages/Dashboard'
import { ContractForm } from './pages/ContractForm'
import { QuotationForm } from './pages/QuotationForm'
import { AdvanceRequestForm } from './pages/AdvanceRequestForm'
import { TemplateManager } from './pages/TemplateManager'
import { Settings } from './pages/Settings'
import { History } from './pages/History'
import { DynamicForm } from './pages/DynamicForm'
import { useThemeStore } from './stores/theme.store'
import { playClickSound } from './lib/sound'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={
              <PageTransition>
                <Dashboard />
              </PageTransition>
            }
          />
          <Route
            path="/contract"
            element={
              <PageTransition>
                <ContractForm />
              </PageTransition>
            }
          />
          <Route
            path="/quotation"
            element={
              <PageTransition>
                <QuotationForm />
              </PageTransition>
            }
          />
          <Route
            path="/advance-request"
            element={
              <PageTransition>
                <AdvanceRequestForm />
              </PageTransition>
            }
          />
          <Route
            path="/history"
            element={
              <PageTransition>
                <History />
              </PageTransition>
            }
          />
          <Route
            path="/templates"
            element={
              <PageTransition>
                <TemplateManager />
              </PageTransition>
            }
          />
          <Route
            path="/custom-form/:templateId"
            element={
              <PageTransition>
                <DynamicForm />
              </PageTransition>
            }
          />
          <Route
            path="/settings"
            element={
              <PageTransition>
                <Settings />
              </PageTransition>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  const loadTheme = useThemeStore((s) => s.loadTheme)
  const isLoaded = useThemeStore((s) => s.isLoaded)

  useEffect(() => {
    loadTheme()
  }, [loadTheme])

  // Global Click Tactile Sound & Web Haptic Feedback Listener
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.closest('button') ||
          target.closest('a'))
      ) {
        playClickSound()
      }
    }

    window.addEventListener('click', handleGlobalClick, true)
    return () => window.removeEventListener('click', handleGlobalClick, true)
  }, [])

  if (!isLoaded) {
    return null
  }

  return (
    <HashRouter>
      <AnimatedRoutes />
    </HashRouter>
  )
}

export default App

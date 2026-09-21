import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loaded pages to optimize production bundle size
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/AboutUs'));
const Translator = lazy(() => import('./pages/Translator'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Glossaries = lazy(() => import('./pages/Glossaries'));
const Teams = lazy(() => import('./pages/Teams'));
const History = lazy(() => import('./pages/History'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const TranslationMemory = lazy(() => import('./pages/TranslationMemory'));
const Assistant = lazy(() => import('./pages/Assistant'));

function Placeholder({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-main">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-text-muted mt-4">Coming soon...</p>
    </div>
  );
}



export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-text-muted">Loading OneClick...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/translator" element={<Translator />} />
                <Route path="/dubbing" element={<Translator />} />
                <Route path="/subtitles" element={<Translator />} />
                <Route path="/documents" element={<Translator />} />
                <Route path="/images" element={<Translator />} />
                
                <Route path="/glossaries" element={<Glossaries />} />
                <Route path="/history" element={<History />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:projectId" element={<ProjectDetail />} />
                <Route path="/memory" element={<TranslationMemory />} />
                <Route path="/teams" element={<Teams />} />
                <Route path="/assistant" element={<Assistant />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

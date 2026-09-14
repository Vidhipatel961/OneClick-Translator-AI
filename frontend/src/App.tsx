import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loaded pages to optimize production bundle size
const Home = lazy(() => import('./pages/Home'));
const Translator = lazy(() => import('./pages/Translator'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-slate-400 mt-4">Coming soon...</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Loading Lingora...</div>}>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/translator" element={<Translator />} />
            <Route path="/glossaries" element={<Glossaries />} />
            <Route path="/history" element={<History />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<ProjectDetail />} />
            <Route path="/memory" element={<ProtectedRoute><TranslationMemory /></ProtectedRoute>} />
            <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/settings" element={<Placeholder title="Settings" />} />
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

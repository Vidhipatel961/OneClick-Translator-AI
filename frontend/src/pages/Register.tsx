import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, AlertCircle } from 'lucide-react';

const getErrorMessage = (detail: unknown, fallback: string) => {
  if (Array.isArray(detail)) {
    return detail[0]?.msg || fallback;
  }

  return typeof detail === 'string' ? detail : fallback;
};

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Register
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(getErrorMessage(data.detail, 'Registration failed'));
      }

      // Auto-login
      const loginRes = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const loginData = await loginRes.json();
      
      if (!loginRes.ok) {
        throw new Error(getErrorMessage(loginData.detail, 'Auto-login failed'));
      }
      
      const meRes = await fetch('http://localhost:8000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${loginData.access_token}` }
      });
      const userData = await meRes.json();

      if (!meRes.ok) {
        throw new Error(getErrorMessage(userData.detail, 'Could not load your account'));
      }

      login(loginData.access_token, userData);
      navigate('/translator');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center gap-2 mb-6">
          <Globe className="h-10 w-10 text-blue-500" />
          <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Lingora AI</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Create your account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300">Email address</label>
              <div className="mt-1">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <div className="mt-1">
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white" />
              </div>
            </div>
            <div>
              <button type="submit" disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition">
                {isLoading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center text-sm">
             <span className="text-slate-400">Already have an account? </span>
             <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

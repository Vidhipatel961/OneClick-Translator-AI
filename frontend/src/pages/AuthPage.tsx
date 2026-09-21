import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, AlertCircle, Loader2, Mail, Lock, User, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(location.pathname === '/register');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  // The specific lime green from the image
    useEffect(() => {
    setIsSignUp(location.pathname === '/register');
    setError('');
  }, [location.pathname]);

  const handleToggle = () => {
    const newIsSignUp = !isSignUp;
    setIsSignUp(newIsSignUp);
    setError('');
    navigate(newIsSignUp ? '/register' : '/login', { replace: true });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) return;
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail && typeof data.detail === 'string' ? data.detail : 'Login failed');

      const meRes = await fetch('http://localhost:8000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      const userData = await meRes.json();

      login(data.access_token, userData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUp) return;
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: name })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail && typeof data.detail === 'string' ? data.detail : 'Registration failed');

      handleToggle();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans overflow-hidden relative selection:bg-primary/30 selection:text-[#ccff00]">
      
      {/* Container matching the exact image rounded-[2rem] and background */}
      <div className="relative w-full max-w-[1000px] h-[600px] bg-surface rounded-[2rem] shadow-2xl overflow-hidden border border-border">
        
        {/* Sign In Form (Left Side) */}
        <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center px-14 transition-all duration-700 ease-in-out ${isSignUp ? 'opacity-0 z-0 translate-x-[20%]' : 'opacity-100 z-10 translate-x-0'}`}>
          <div className="mb-6">
            <h2 className="text-[2.25rem] font-bold text-text-main mb-1 tracking-tight">
              Welcome <span className="text-primary">Back</span>
            </h2>
            <p className="text-text-muted text-[13px] font-medium">Enter your credentials to access your secure account</p>
          </div>
          
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {(!isSignUp && error) && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-text-main/90">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-disabled group-focus-within:text-text-main transition-colors" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@domain.com" 
                  className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-3 text-[13px] text-text-main placeholder-[#444] focus:outline-none focus:border-primary/30 transition-all" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-text-main/90">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-disabled group-focus-within:text-text-main transition-colors" />
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" 
                  className="w-full bg-background border border-border rounded-xl pl-11 pr-11 py-3 text-[13px] text-text-main placeholder-[#444] focus:outline-none focus:border-primary/30 transition-all tracking-widest" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-main transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors ${rememberMe ? 'bg-primary' : 'bg-background border border-border group-hover:border-primary/50'}`}>
                  {rememberMe && <Check className="w-3 h-3 text-background" strokeWidth={3} />}
                </div>
                <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                <span className="text-[12px] font-medium text-text-main/90">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-[12px] font-medium text-text-muted hover:text-text-main transition-colors">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={isLoading} className="w-full mt-4 text-background font-bold rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-70 transition-all hover:scale-[1.02] active:scale-[0.98] bg-primary">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          
          <div className="mt-8 text-center text-[12px] font-medium">
            <span className="text-text-muted">Don't have an account? </span>
            <button type="button" onClick={handleToggle} className="font-bold transition-colors" className="text-primary">Sign Up</button>
          </div>
        </div>

        {/* Sign Up Form (Right Side) */}
        <div className={`absolute top-0 right-0 w-1/2 h-full flex flex-col justify-center px-14 transition-all duration-700 ease-in-out ${isSignUp ? 'opacity-100 z-10 translate-x-0' : 'opacity-0 z-0 translate-x-[-20%]'}`}>
          <div className="mb-6">
            <h2 className="text-[2.25rem] font-bold text-text-main mb-1 tracking-tight">
              Create <span className="text-primary">Account</span>
            </h2>
            <p className="text-text-muted text-[13px] font-medium">Start translating at the speed of thought.</p>
          </div>
          
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {(isSignUp && error) && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-text-main/90">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-disabled group-focus-within:text-text-main transition-colors" />
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" 
                  className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-3 text-[13px] text-text-main placeholder-[#444] focus:outline-none focus:border-primary/30 transition-all" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-text-main/90">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-disabled group-focus-within:text-text-main transition-colors" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@domain.com" 
                  className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-3 text-[13px] text-text-main placeholder-[#444] focus:outline-none focus:border-primary/30 transition-all" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-text-main/90">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-disabled group-focus-within:text-text-main transition-colors" />
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" 
                  className="w-full bg-background border border-border rounded-xl pl-11 pr-11 py-3 text-[13px] text-text-main placeholder-[#444] focus:outline-none focus:border-primary/30 transition-all tracking-widest" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-main transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full mt-4 text-background font-bold rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-70 transition-all hover:scale-[1.02] active:scale-[0.98] bg-primary">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          <div className="mt-6 text-center text-[12px] font-medium">
            <span className="text-text-muted">Already have an account? </span>
            <button type="button" onClick={handleToggle} className="font-bold transition-colors" className="text-primary">Sign In</button>
          </div>
        </div>

        {/* Sliding Overlay Panel with Angled Edge */}
        <div 
          className={`absolute top-0 left-0 w-[55%] h-full bg-surface-hover transition-transform duration-700 ease-in-out z-50 flex flex-col p-14 ${isSignUp ? 'translate-x-[0%]' : 'translate-x-[82%]'}`}
          style={{ 
            clipPath: isSignUp ? 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)' : 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)',
            transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), clip-path 0.7s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        >
          {/* Top Logo */}
          <Link to="/" className={`flex items-center gap-2 relative z-10 w-fit transition-transform duration-700 ${isSignUp ? 'translate-x-0' : 'translate-x-12'}`}>
            <Globe className="h-6 w-6" className="text-primary" />
            <span className="text-xl font-bold tracking-tight text-text-main">OneClick AI</span>
          </Link>

          {/* Center Content */}
          <div className={`relative z-10 mt-20 h-40 flex items-center transition-transform duration-700 ${isSignUp ? 'translate-x-0' : 'translate-x-12'}`}>
            <AnimatePresence mode="wait">
              {isSignUp ? (
                <motion.div 
                  key="signup-text"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}
                >
                  <h1 className="text-[2.75rem] font-bold text-text-main leading-[1.1] mb-5 tracking-tight">
                    Join the global <br />revolution.
                  </h1>
                  <p className="text-text-muted text-[15px] font-medium max-w-sm leading-relaxed">
                    Thousands of professionals are already using our AI workspace.
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  key="login-text"
                  initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }}
                >
                  <h1 className="text-[2.75rem] font-bold text-text-main leading-[1.1] mb-5 tracking-tight">
                    Welcome back <br />to the future of <br />localization.
                  </h1>
                  <p className="text-text-muted text-[15px] font-medium max-w-sm leading-relaxed pr-8">
                    Your enterprise AI workspace for translation, dubbing, and global communication is ready.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Very Faint Background Globe */}
            <Globe className="absolute -bottom-20 right-0 w-96 h-96 opacity-[0.03] pointer-events-none -z-10" className="text-primary" />
          </div>

          {/* Footer */}
          <div className={`relative z-10 mt-auto text-[13px] font-medium text-text-disabled transition-transform duration-700 ${isSignUp ? 'translate-x-0' : 'translate-x-12'}`}>
            © {new Date().getFullYear()} OneClick AI.
          </div>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Lock, AlertCircle, Loader2, Globe, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!token) {
      setError('Invalid or expired reset token.');
      return;
    }

    setIsLoading(true);
    
    // Simulate backend password update
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none animate-pulse-glow"></div>
      
      <div className="relative w-full max-w-md h-[550px] bg-[#0A0A0A] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col items-center justify-center border border-border">
        {/* Glow corners */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] -z-10"></div>
        
        <div className="w-full px-12 py-8 relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-12 justify-center">
            <Globe className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight text-white">OneClick AI</span>
          </Link>
          
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full">
            <motion.div variants={fadeUp} className="mb-8 text-center">
              <h2 className="text-3xl font-bold mb-2 text-white">New <span className="text-primary">Password</span></h2>
              <p className="text-text-muted text-sm font-medium">Create a strong password for your account.</p>
            </motion.div>

            {success ? (
              <motion.div variants={fadeUp} className="flex flex-col items-center w-full gap-4">
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex flex-col items-center text-center gap-3 text-primary-dark w-full">
                  <Sparkles className="w-8 h-8 flex-shrink-0 mb-2 text-primary" />
                  <p className="text-sm font-medium">Your password has been successfully reset!</p>
                  <Link to="/login" className="mt-4 bg-primary hover:bg-primary-dark text-background font-bold rounded-xl py-3 px-6 flex items-center justify-center shadow-[0_4px_14px_0_rgba(var(--primary),0.2)]">
                    Sign In Now
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.form variants={fadeUp} onSubmit={handleResetSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-text-main ml-1">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-disabled group-focus-within:text-primary transition-colors" />
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½" className="w-full bg-surface border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                  </div>
                </div>

                <button type="submit" disabled={isLoading} className="w-full mt-8 bg-primary hover:bg-primary-dark text-background font-bold rounded-xl py-3.5 flex items-center justify-center shadow-[0_4px_14px_0_rgba(var(--primary),0.2)] hover:shadow-[0_6px_20px_rgba(var(--primary),0.3)] disabled:opacity-70 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                </button>
              </motion.form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

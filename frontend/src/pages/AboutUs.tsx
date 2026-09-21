import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Users, Target, Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30 pb-20">
      <nav className="fixed w-full z-50 bg-[#0d0f12]/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2">
              <Globe className="h-8 w-8 text-primary animate-[spin_10s_linear_infinite]" />
              <span className="text-xl font-bold text-white tracking-tight">OneClick AI</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-text-muted hover:text-white transition-colors">Features</Link>
              <Link to="/about" className="text-white font-medium">About Us</Link>
              <Link to="/login" className="text-text-muted hover:text-white transition-colors font-medium">Log in</Link>
              <Link to="/register" className="bg-primary hover:bg-primary-dark text-black px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 shadow-lg shadow-primary/20">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px] -z-10 pointer-events-none"></motion.div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/50 backdrop-blur-sm border border-slate-700/50 mb-8">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-slate-300">Our Mission</span>
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight text-white">
              Connecting the world <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark">without barriers.</span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="mt-4 text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              We believe that language should never be a barrier to communication, education, or business. 
              OneClick AI was founded on the principle that true global connection requires enterprise-grade localization tools that are accessible to everyone.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-100px' }} className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeUp} className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white">The future of localization is AI-driven and human-centric.</h2>
              <p className="text-slate-400 leading-relaxed">
                Traditional translation is slow, expensive, and often loses the original context. At OneClick AI, we combine state-of-the-art large language models with advanced voice cloning and computer vision to create a unified platform that understands context just like a human would.
              </p>
            </motion.div>
            
            <motion.div variants={fadeUp} className="relative">
              <div className="aspect-square rounded-[3rem] overflow-hidden bg-[#0d0f12]/60 backdrop-blur-xl border border-slate-700/30 p-8 shadow-2xl relative flex flex-col justify-center items-center text-center">
                <Globe className="w-32 h-32 text-primary opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <h3 className="text-6xl font-bold text-white mb-2 relative z-10"><AnimatedCounter value={100} suffix="+" /></h3>
                <p className="text-primary font-medium text-lg relative z-10 mb-8">Languages Supported</p>
                <h3 className="text-6xl font-bold text-white mb-2 relative z-10"><AnimatedCounter value={50} suffix="M+" /></h3>
                <p className="text-primary font-medium text-lg relative z-10">Words Translated Daily</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 300, damping: 24 }} className="bg-[#0d0f12]/80 backdrop-blur-xl border border-primary/20 rounded-[2.5rem] p-12 text-center shadow-[0_0_50px_rgba(var(--primary),0.1)]">
            <h2 className="text-3xl font-bold text-white mb-4">Join our global community</h2>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              Start transforming your content today and reach audiences worldwide without lifting a finger.
            </p>
            <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-black font-bold rounded-xl py-4 px-8 transition-all shadow-[0_4px_14px_0_rgba(var(--primary),0.3)] hover:scale-105">
              Start Free Trial <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}


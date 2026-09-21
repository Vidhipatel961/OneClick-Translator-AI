import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { 
  Globe, 
  Mic, 
  Video, 
  FileText, 
  Image as ImageIcon, 
  File, 
  ChevronRight, 
  Play,
  Upload,
  Zap,
  MessageSquare,
  CheckCircle2,
  Menu,
  X,
  Sparkles, Users
} from 'lucide-react';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 glass border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <Globe className="h-8 w-8 text-primary animate-pulse-glow" />
            <span className="text-xl font-bold text-text-main tracking-tight">OneClick AI</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="/about" className="text-text-muted hover:text-text-main transition-colors">About Us</a>
            <a href="#features" className="text-text-muted hover:text-text-main transition-colors">Features</a>
            {/* <a href="#how-it-works" className="text-text-muted hover:text-text-main transition-colors">How it Works</a> */}
            {/* <a href="#pricing" className="text-text-muted hover:text-text-main transition-colors">Pricing</a> */}
            {/* <a href="#faq" className="text-text-muted hover:text-text-main transition-colors">FAQ</a> */}
            <a href="/login" className="text-text-muted hover:text-text-main transition-colors font-medium">Log in</a>
            <a href="/register" className="bg-primary hover:bg-primary-dark text-background px-5 py-2 rounded-lg font-semibold transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(var(--primary),0.3)]">
              Start Free Trial
            </a>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-text-main">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-surface border-b border-border absolute w-full left-0 shadow-2xl">
          <div className="px-4 pt-2 pb-6 flex flex-col space-y-3">
            <a href="/about" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-text-main hover:bg-surface-hover rounded-lg font-medium">About Us</a>
            <a href="#features" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-text-main hover:bg-surface-hover rounded-lg font-medium">Features</a>
            {/* <a href="#how-it-works" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-text-main hover:bg-surface-hover rounded-lg font-medium">How it Works</a> */}
            {/* <a href="#pricing" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-text-main hover:bg-surface-hover rounded-lg font-medium">Pricing</a> */}
            <hr className="border-border my-2" />
            <a href="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-text-main hover:bg-surface-hover rounded-lg font-medium">Log in</a>
            <a href="/register" onClick={() => setIsOpen(false)} className="block w-full text-center mt-2 bg-primary text-[#04110F] px-4 py-3 rounded-lg font-semibold">Start Free Trial</a>
          </div>
        </div>
      )}
    </nav>
  );
};

const Hero = ({ setShowDemo }: { setShowDemo: (val: boolean) => void }) => {
  return (
    <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Glow Effects */}
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/10 rounded-full blur-[120px] -z-10 pointer-events-none"></motion.div>
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none"></motion.div>

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center"
      >
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-border mb-8 animate-float">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-text-main">Translate. Dub. Subtitle. Understand.</span>
        </motion.div>
        
        <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
          Break language barriers <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">with AI.</span>
        </motion.h1>
        
        <motion.p variants={fadeUp} className="mt-4 text-xl text-text-muted max-w-3xl mx-auto mb-10">
          Translate, transcribe, dub, subtitle, and understand your content in any language with enterprise-grade accuracy.
        </motion.p>
        
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a href="/register" className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-background px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(207,255,74,0.4)] flex items-center justify-center gap-2">
            Start Free Trial <ChevronRight className="h-5 w-5" />
          </a>
          <button onClick={() => setShowDemo(true)} className="w-full sm:w-auto glass hover:bg-surface-hover text-text-main px-8 py-4 rounded-lg font-semibold text-lg transition-all border border-border flex items-center justify-center gap-2 group">
            <Play className="h-5 w-5 text-secondary group-hover:text-primary transition-colors" /> Watch Demo
          </button>
        </motion.div>

        {/* Abstract Visualization */}
        <motion.div variants={fadeUp} className="mt-24 relative mx-auto max-w-5xl">
          <div className="aspect-[21/9] rounded-2xl glass-panel overflow-hidden shadow-2xl relative flex items-center justify-center border border-primary/20">
            {/* World/AI Globe representation */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
            
            <div className="relative z-10 flex flex-col items-center">
               <Globe className="h-24 w-24 text-primary animate-[spin_30s_linear_infinite] opacity-80" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-32 h-32 rounded-full border border-secondary/30 animate-[ping_3s_infinite]"></div>
               </div>
            </div>

            {/* Orbiting Language Nodes */}
            <div className="absolute top-1/4 left-1/4 px-4 py-2 rounded-lg glass text-sm font-medium animate-float" style={{ animationDelay: '0s' }}>Hello</div>
            <div className="absolute bottom-1/4 left-1/3 px-4 py-2 rounded-lg glass text-sm font-medium animate-float" style={{ animationDelay: '1s' }}>Hola</div>
            <div className="absolute top-1/3 right-1/4 px-4 py-2 rounded-lg glass text-sm font-medium animate-float" style={{ animationDelay: '2s' }}>Bonjour</div>
            <div className="absolute bottom-1/3 right-1/3 px-4 py-2 rounded-lg glass text-sm font-medium animate-float" style={{ animationDelay: '3s' }}>à¤¨à¤®à¤¸à¥à¤¤à¥‡</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

const SupportedMedia = () => {
  const mediaTypes = [
    { icon: <Video className="w-6 h-6" />, name: "Video", desc: "MP4, MOV, AVI" },
    { icon: <Mic className="w-6 h-6" />, name: "Audio", desc: "MP3, WAV, M4A" },
    { icon: <FileText className="w-6 h-6" />, name: "Documents", desc: "PDF, DOCX, PPTX" },
    { icon: <ImageIcon className="w-6 h-6" />, name: "Images", desc: "JPG, PNG" },
    { icon: <File className="w-6 h-6" />, name: "Text", desc: "TXT, SRT, VTT" }
  ];

  return (
    <section className="py-20 border-y border-border bg-surface/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-text-muted uppercase tracking-wider mb-10">
          Supported Formats
        </p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {mediaTypes.map((type, i) => (
            <div key={i} className="flex flex-col items-center gap-3 group cursor-pointer">
              <div className="p-4 bg-surface rounded-xl border border-border text-text-muted group-hover:text-primary group-hover:border-primary/50 group-hover:shadow-[0_0_15px_rgba(207,255,74,0.2)] group-hover:-translate-y-1 transition-all duration-300">
                {type.icon}
              </div>
              <span className="font-medium text-text-main group-hover:text-primary transition-colors">{type.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    {
      title: "Context-Aware Translation",
      description: "Our AI understands nuance, idioms, and industry-specific terminology for flawless text translation.",
      icon: <Globe className="w-6 h-6 text-primary" />
    },
    {
      title: "Hyper-Realistic Voice Dubbing",
      description: "Clone original voices and emotions to create natural-sounding dubbed videos in 50+ languages.",
      icon: <Mic className="w-6 h-6 text-secondary" />
    },
    {
      title: "Automated Subtitling",
      description: "Generate pixel-perfect, timing-accurate subtitles with one click. Burn them in or export as SRT/VTT.",
      icon: <Video className="w-6 h-6 text-accent" />
    },
    {
      title: "Team Workspaces",
      description: "Collaborate seamlessly with your global team. Share glossaries, translation memories, and projects.",
      icon: <Users className="w-6 h-6 text-primary" />
    },
    {
      title: "AI Translation Memory",
      description: "Never translate the same sentence twice. Our AI learns from your edits and maintains consistency.",
      icon: <CheckCircle2 className="w-6 h-6 text-secondary" />
    },
    {
      title: "Lightning Fast API",
      description: "Integrate OneClick AI directly into your product or workflow with our robust, low-latency API.",
      icon: <Zap className="w-6 h-6 text-accent" />
    }
  ];

  return (
    <section id="features" className="py-24 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to go global.</h2>
          <p className="text-xl text-text-muted">A unified platform for all your localization needs, powered by the world's most advanced AI models.</p>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={fadeUp} className="glass-panel p-8 rounded-2xl border border-border hover:border-primary/50 transition-colors group">
              <div className="w-14 h-14 rounded-xl bg-surface border border-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-text-muted leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const PricingPreview = () => {
  return (
    <section id="pricing" className="py-24 relative bg-surface/20 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-text-main">Simple, transparent pricing</h2>
          <p className="text-lg text-text-muted">
            Start for free, upgrade when you need more power.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter */}
          <div className="glass rounded-3xl p-8 border border-border hover:border-text-disabled transition-colors">
            <h3 className="text-xl font-semibold mb-2 text-text-main">Starter</h3>
            <div className="text-4xl font-bold mb-6 text-text-main">$<AnimatedCounter value={0} /><span className="text-lg text-text-muted font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8">
              <li className="flex gap-3 text-text-muted"><CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" /> <AnimatedCounter value={10000} /> text words/mo</li>
              <li className="flex gap-3 text-text-muted"><CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" /> <AnimatedCounter value={10} /> mins video/audio</li>
              <li className="flex gap-3 text-text-muted"><CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" /> <AnimatedCounter value={5} /> document translations</li>
            </ul>
            <button className="w-full py-3 rounded-lg border border-border hover:bg-surface-hover text-text-main transition font-medium">Get Started</button>
          </div>

          {/* Pro */}
          <div className="glass-panel rounded-3xl p-8 relative transform md:-translate-y-4 shadow-[0_10px_40px_rgba(33,214,178,0.15)] border-primary/50">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-background px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Most Popular</div>
            <h3 className="text-xl font-semibold mb-2 text-primary">Pro</h3>
            <div className="text-4xl font-bold mb-6 text-text-main">$<AnimatedCounter value={49} /><span className="text-lg text-text-muted font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8">
              <li className="flex gap-3 text-text-main"><CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" /> <AnimatedCounter value={250000} /> text words/mo</li>
              <li className="flex gap-3 text-text-main"><CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" /> <AnimatedCounter value={300} /> mins video/audio</li>
              <li className="flex gap-3 text-text-main"><CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" /> Unlimited documents</li>
              <li className="flex gap-3 text-text-main"><CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" /> Voice cloning access</li>
            </ul>
            <button className="w-full py-3 rounded-lg bg-primary hover:bg-primary-dark text-background transition font-semibold shadow-[0_0_15px_rgba(207,255,74,0.3)]">Subscribe Now</button>
          </div>

          {/* Enterprise */}
          <div className="glass rounded-3xl p-8 border border-border hover:border-text-disabled transition-colors">
            <h3 className="text-xl font-semibold mb-2 text-text-main">Enterprise</h3>
            <div className="text-4xl font-bold mb-6 text-text-main">Custom</div>
            <ul className="space-y-4 mb-8">
              <li className="flex gap-3 text-text-muted"><CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" /> Unlimited usage</li>
              <li className="flex gap-3 text-text-muted"><CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" /> API Access</li>
              <li className="flex gap-3 text-text-muted"><CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" /> Custom integrations</li>
              <li className="flex gap-3 text-text-muted"><CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" /> Dedicated manager</li>
            </ul>
            <button className="w-full py-3 rounded-lg border border-border hover:bg-surface-hover text-text-main transition font-medium">Contact Sales</button>
          </div>
        </div>
      </div>
    </section>
  );
};

const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-main">Ready to break language barriers?</h2>
        <p className="text-lg text-text-muted mb-10 max-w-2xl mx-auto">
          Join thousands of creators, agencies, and enterprises scaling their global reach.
        </p>
        <a href="/register" className="bg-primary hover:bg-primary-dark text-background px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-[0_0_20px_rgba(207,255,74,0.3)] flex items-center justify-center gap-2 mx-auto w-fit">
          Start for free <ChevronRight className="w-5 h-5" />
        </a>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background pt-20 pb-10 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2 lg:col-span-2">
             <div className="flex items-center gap-2 mb-6">
              <Globe className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-text-main">OneClick AI</span>
            </div>
            <p className="text-text-muted max-w-sm mb-6">
              The premium AI-powered localization platform.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-text-main mb-4">Product</h4>
            <ul className="space-y-3 text-text-muted">
              <li><a href="#" className="hover:text-primary transition">Features</a></li>
              <li><a href="#" className="hover:text-primary transition">Pricing</a></li>
              <li><a href="#" className="hover:text-primary transition">API</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-text-main mb-4">Company</h4>
            <ul className="space-y-3 text-text-muted">
              <li><a href="#" className="hover:text-primary transition">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-text-disabled">
          <p>Â© {new Date().getFullYear()} OneClick AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);
  return (
    <div className="min-h-screen font-sans selection:bg-primary/30 selection:text-primary text-text-main">
      <Navbar />
      <main>
        <Hero setShowDemo={setShowDemo} />
        <SupportedMedia />
        <Features />
        <PricingPreview />
        <CTA />
      </main>
      <Footer />
      
      {showDemo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={() => setShowDemo(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-border z-10"
          >
            <button 
              onClick={() => setShowDemo(false)}
              className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/50 hover:bg-primary text-white hover:text-black rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/Q8J9y9N3aZ4?autoplay=1&mute=1" 
                title="AI Translation Demo" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="w-full h-full object-cover"
              ></iframe>
          </motion.div>
        </div>
      )}
    </div>
  );
}


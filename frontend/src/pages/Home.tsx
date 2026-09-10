import React, { useState } from 'react';
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
  Shield,
  Clock,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <Globe className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Lingora AI</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-slate-300 hover:text-white transition">Features</a>
            <a href="#how-it-works" className="text-slate-300 hover:text-white transition">How it Works</a>
            <a href="#pricing" className="text-slate-300 hover:text-white transition">Pricing</a>
            <a href="#faq" className="text-slate-300 hover:text-white transition">FAQ</a>
            <button className="text-slate-300 hover:text-white transition">Log in</button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium transition shadow-lg shadow-blue-500/30">
              Start Free Trial
            </button>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-300">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#features" className="block px-3 py-2 text-slate-300 hover:text-white">Features</a>
            <a href="#how-it-works" className="block px-3 py-2 text-slate-300 hover:text-white">How it Works</a>
            <a href="#pricing" className="block px-3 py-2 text-slate-300 hover:text-white">Pricing</a>
            <button className="w-full text-left px-3 py-2 text-blue-400 font-medium">Start Free Trial</button>
          </div>
        </div>
      )}
    </nav>
  );
};

const Hero = () => {
  return (
    <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 mb-8">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium text-slate-300">Translate. Dub. Subtitle. Understand.</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
          Turn Any Media Into <br className="hidden md:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Any Language.</span>
        </h1>
        
        <p className="mt-4 text-xl text-slate-400 max-w-3xl mx-auto mb-10">
          The ultimate AI-powered localization platform. Translate documents, dub videos with 
          hyper-realistic voice clones, generate perfect subtitles, and extract insights from any content.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a href="/translator" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2">
            Start Translating <ChevronRight className="h-5 w-5" />
          </a>
          <button className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition border border-slate-700 flex items-center justify-center gap-2">
            <Upload className="h-5 w-5" /> Upload Demo
          </button>
        </div>

        {/* Abstract Visualization */}
        <div className="mt-20 relative mx-auto max-w-5xl">
          <div className="aspect-[16/9] rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden shadow-2xl relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
            
            <div className="relative z-10 flex flex-col items-center">
               <div className="h-24 w-24 rounded-full bg-blue-500/20 flex items-center justify-center mb-6 animate-pulse">
                  <Play className="h-10 w-10 text-blue-400 ml-2" />
               </div>
               <div className="flex items-center gap-4 text-2xl font-medium">
                 <span className="text-white">English</span>
                 <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full relative">
                    <div className="absolute w-3 h-3 bg-white rounded-full -top-1 left-0 animate-[ping_2s_infinite]"></div>
                 </div>
                 <span className="text-purple-400">Spanish</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SupportedMedia = () => {
  const mediaTypes = [
    { icon: <Video className="w-6 h-6" />, name: "Video", desc: "MP4, MOV, AVI" },
    { icon: <Mic className="w-6 h-6" />, name: "Audio", desc: "MP3, WAV, M4A" },
    { icon: <FileText className="w-6 h-6" />, name: "Documents", desc: "PDF, DOCX, PPTX" },
    { icon: <ImageIcon className="w-6 h-6" />, name: "Images", desc: "JPG, PNG, TIFF" },
    { icon: <File className="w-6 h-6" />, name: "Text", desc: "TXT, SRT, VTT" }
  ];

  return (
    <section className="py-20 bg-slate-900 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-wider mb-10">
          Process Any Media Format
        </p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70">
          {mediaTypes.map((type, i) => (
            <div key={i} className="flex flex-col items-center gap-2 hover:opacity-100 transition cursor-pointer">
              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 text-slate-300">
                {type.icon}
              </div>
              <span className="font-medium text-slate-200">{type.name}</span>
              <span className="text-xs text-slate-500">{type.desc}</span>
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
      icon: <Globe className="w-6 h-6 text-blue-400" />
    },
    {
      title: "Hyper-Realistic Voice Dubbing",
      description: "Clone original voices and emotions to create natural-sounding dubbed videos in 50+ languages.",
      icon: <Mic className="w-6 h-6 text-purple-400" />
    },
    {
      title: "Automated Subtitling",
      description: "Generate pixel-perfect, timing-accurate subtitles with one click. Burn them in or export as SRT/VTT.",
      icon: <Video className="w-6 h-6 text-pink-400" />
    },
    {
      title: "Document Formatting Preservation",
      description: "Translate complex PDFs, DOCX, and PPTX files while perfectly maintaining the original layout and styling.",
      icon: <FileText className="w-6 h-6 text-emerald-400" />
    }
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to go global</h2>
          <p className="text-xl text-slate-400">
            Lingora AI provides a complete suite of tools to localize your content seamlessly across every medium.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="p-8 rounded-3xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition">
              <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center mb-6 border border-slate-700">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const AI_Capabilities = () => {
  return (
    <section className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">More than just translation.</h2>
            <p className="text-xl text-slate-400 mb-8">
              Unlock the power of your localized content with our built-in AI assistant.
            </p>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1"><Zap className="w-6 h-6 text-yellow-400" /></div>
                <div>
                  <h4 className="text-lg font-semibold">Instant Summaries</h4>
                  <p className="text-slate-400">Upload a 2-hour video or a 100-page PDF and get a concise summary in seconds, in any language.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1"><MessageSquare className="w-6 h-6 text-blue-400" /></div>
                <div>
                  <h4 className="text-lg font-semibold">Chat with your Media</h4>
                  <p className="text-slate-400">Ask questions directly to your uploaded documents, videos, and audio files to extract specific insights.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl -z-10"></div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-slate-400 ml-2">Chat Assistant</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0"></div>
                   <div className="bg-slate-700/50 rounded-2xl rounded-tl-none p-4 text-sm text-slate-300">
                     Can you summarize the key points from the Q3 earnings call video I just uploaded?
                   </div>
                </div>
                <div className="flex gap-4 flex-row-reverse">
                   <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center">
                     <Sparkles className="w-4 h-4 text-white" />
                   </div>
                   <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl rounded-tr-none p-4 text-sm text-blue-100">
                     Certainly! The video highlighted 3 main points: 1) Revenue grew 24% YoY, 2) The new European expansion is ahead of schedule, 3) Profit margins improved by 200bps.
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const PricingPreview = () => {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, transparent pricing</h2>
          <p className="text-xl text-slate-400">
            Start for free, upgrade when you need more power.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-slate-700 transition">
            <h3 className="text-xl font-semibold mb-2">Starter</h3>
            <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-slate-500 font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8">
              <li className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" /> 10,000 text words/mo</li>
              <li className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" /> 10 mins video/audio</li>
              <li className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" /> 5 document translations</li>
            </ul>
            <button className="w-full py-3 rounded-full border border-slate-700 hover:bg-slate-800 transition font-medium">Get Started</button>
          </div>

          {/* Pro */}
          <div className="bg-gradient-to-b from-blue-900/40 to-slate-900 border border-blue-500/50 rounded-3xl p-8 relative transform md:-translate-y-4 shadow-2xl shadow-blue-900/20">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">Most Popular</div>
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <div className="text-4xl font-bold mb-6">$49<span className="text-lg text-slate-400 font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8">
              <li className="flex gap-3 text-slate-100"><CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" /> 250,000 text words/mo</li>
              <li className="flex gap-3 text-slate-100"><CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" /> 300 mins video/audio</li>
              <li className="flex gap-3 text-slate-100"><CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" /> Unlimited documents</li>
              <li className="flex gap-3 text-slate-100"><CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" /> Voice cloning access</li>
            </ul>
            <button className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition font-medium shadow-lg shadow-blue-500/25">Subscribe Now</button>
          </div>

          {/* Enterprise */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-slate-700 transition">
            <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
            <div className="text-4xl font-bold mb-6">Custom</div>
            <ul className="space-y-4 mb-8">
              <li className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" /> Unlimited usage</li>
              <li className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" /> API Access</li>
              <li className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" /> Custom integrations</li>
              <li className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" /> Dedicated account manager</li>
            </ul>
            <button className="w-full py-3 rounded-full border border-slate-700 hover:bg-slate-800 transition font-medium">Contact Sales</button>
          </div>
        </div>
      </div>
    </section>
  );
};

const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-600/10"></div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-6">Ready to break language barriers?</h2>
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
          Join thousands of creators, agencies, and enterprises scaling their global reach with Lingora AI.
        </p>
        <a href="/translator" className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 rounded-full font-semibold text-lg transition shadow-xl flex items-center justify-center gap-2 mx-auto w-fit">
          Start for free <ChevronRight className="w-5 h-5" />
        </a>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-slate-950 pt-20 pb-10 border-t border-slate-900 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2 lg:col-span-2">
             <div className="flex items-center gap-2 mb-6">
              <Globe className="h-6 w-6 text-blue-500" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Lingora AI</span>
            </div>
            <p className="text-slate-400 max-w-sm mb-6">
              Turn any media into any language. The AI-powered localization platform for the modern web.
            </p>
            <div className="flex space-x-4">
              {/* Social icons placeholders */}
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition cursor-pointer">X</div>
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition cursor-pointer">In</div>
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition cursor-pointer">Gh</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-100 mb-4">Product</h4>
            <ul className="space-y-3 text-slate-400">
              <li><a href="#" className="hover:text-blue-400 transition">Features</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Pricing</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">API</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Supported Languages</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-100 mb-4">Resources</h4>
            <ul className="space-y-3 text-slate-400">
              <li><a href="#" className="hover:text-blue-400 transition">Documentation</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Blog</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Help Center</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Community</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-100 mb-4">Company</h4>
            <ul className="space-y-3 text-slate-400">
              <li><a href="#" className="hover:text-blue-400 transition">About Us</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Careers</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-500">
          <p>© {new Date().getFullYear()} Lingora AI. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span>System Status: <span className="text-emerald-400">100% Operational</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
      <Navbar />
      <main>
        <Hero />
        <SupportedMedia />
        <Features />
        <AI_Capabilities />
        <PricingPreview />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

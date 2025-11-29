import React from 'react';
import { PenLine,  Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[size:40px_40px] pointer-events-none" />
      
      <div className="relative container mx-auto px-6 py-16">
        {/* Main content */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16">
          {/* Brand section */}
          <div className="text-center lg:text-left max-w-md">
            <div className="flex items-center justify-center lg:justify-start mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 rounded-lg blur-lg opacity-30"></div>
                <div className="relative bg-black/20 backdrop-blur-sm border border-blue-400/20 rounded-lg p-3">
                  <PenLine className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <span className="ml-4 text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Sketchy
              </span>
            </div>
            <p className="text-slate-300 text-lg leading-relaxed">
              Beautiful diagrams with a hand-drawn feel. Collaborate in real-time with your team.
            </p>
          </div>

          {/* Contact section */}
          <div className="flex flex-col items-center lg:items-end">
            <a 
              id="contact" 
              href="mailto:info@sketchy.com" 
              className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative flex items-center">
                <Mail className="h-5 w-5 mr-3" />
                Contact Us
              </div>
            </a>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="pt-8 border-t border-slate-800/50">
          <div className="text-center">
            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} Sketchy. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
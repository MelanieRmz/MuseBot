
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, TrendingUp, Image, Coins, Twitter } from "lucide-react";
import WalletConnection from "@/components/WalletConnection";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <style>
        {`
          :root {
            --primary: 147 51 234;
            --primary-foreground: 255 255 255;
            --secondary: 30 41 59;
            --secondary-foreground: 226 232 240;
            --accent: 99 102 241;
            --accent-foreground: 255 255 255;
            --muted: 51 65 85;
            --muted-foreground: 148 163 184;
            --border: 71 85 105;
            --background: 2 6 23;
            --foreground: 248 250 252;
          }
          
          .glass-effect { 
            backdrop-filter: blur(20px);
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .glow-purple {
            box-shadow: 0 0 30px rgba(147, 51, 234, 0.3);
          }
          
          .animated-gradient {
            background: linear-gradient(45deg, #8b5cf6, #a855f7, #c084fc, #8b5cf6);
            background-size: 400% 400%;
            animation: gradientShift 3s ease infinite;
          }
          
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          
          .cyber-border {
            position: relative;
            border: 2px solid transparent;
            background: linear-gradient(45deg, rgba(147, 51, 234, 0.1), rgba(168, 85, 247, 0.1)) padding-box, 
                        linear-gradient(45deg, #8b5cf6, #a855f7) border-box;
          }
        `}
      </style>
      
      {/* Navigation Header */}
      <nav className="glass-effect border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to={createPageUrl("Home")} className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">MemeChan</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to={createPageUrl("Home")} 
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  location.pathname === createPageUrl("Home") 
                    ? 'bg-purple-500/20 text-purple-300' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Generate</span>
              </Link>
              <Link 
                to="https://app--meme-chan-e204f2a8.base44.app/Gallery"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  location.pathname === createPageUrl("Gallery") 
                    ? 'bg-purple-500/20 text-purple-300' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Image className="w-4 h-4" />
                <span>Gallery</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <WalletConnection />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="glass-effect border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-400">© 2024 MemeChan. Powered by AI & Web3</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

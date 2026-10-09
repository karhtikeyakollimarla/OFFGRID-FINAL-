import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Search, PlusCircle, SearchCode, Shield, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isReportActive = location.pathname === '/';
  const isTrackActive = location.pathname.startsWith('/track') || location.pathname.startsWith('/ticket');

  return (
    <header className="bg-[#0B1F3A] text-white border-b border-[#142B48] sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Municipal Brand */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#0D9488] rounded p-1">
            <div className="w-9 h-9 rounded bg-[#142B48] border border-[#1E3A5F] flex items-center justify-center text-[#0D9488] shadow-xs">
              <Building2 className="w-5 h-5 text-[#0D9488]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">Nagrik</span>
                <span className="text-[10px] font-semibold bg-[#142B48] text-[#2DD4BF] px-1.5 py-0.5 rounded border border-[#1E3A5F] uppercase tracking-wider">
                  Official Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-normal leading-none mt-0.5">
                Your City. Your Voice.
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-2 rounded transition-colors ${
                isReportActive
                  ? 'bg-[#142B48] text-white font-semibold border-b-2 border-[#0D9488]'
                  : 'text-slate-300 hover:text-white hover:bg-[#142B48]/60'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#0D9488]" />
              Report an issue
            </Link>

            <Link
              to="/track"
              className={`flex items-center gap-1.5 px-3 py-2 rounded transition-colors ${
                isTrackActive
                  ? 'bg-[#142B48] text-white font-semibold border-b-2 border-[#0D9488]'
                  : 'text-slate-300 hover:text-white hover:bg-[#142B48]/60'
              }`}
            >
              <SearchCode className="w-3.5 h-3.5 text-[#0D9488]" />
              Track a request
            </Link>

            <span className="h-4 w-px bg-[#1E3A5F] mx-2" />

            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-slate-400 hover:text-white hover:bg-[#142B48]/60 text-[11px] font-normal transition-colors"
              title="Official portal for municipal officers"
            >
              <Shield className="w-3 h-3 text-slate-400" />
              Officer Portal
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-[#142B48] rounded focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#142B48] border-t border-[#1E3A5F] px-4 py-3 space-y-1 text-sm font-medium">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded ${
              isReportActive ? 'bg-[#0B1F3A] text-white font-semibold text-[#0D9488]' : 'text-slate-300 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-[#0D9488]" />
            Report an issue
          </Link>
          <Link
            to="/track"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded ${
              isTrackActive ? 'bg-[#0B1F3A] text-white font-semibold text-[#0D9488]' : 'text-slate-300 hover:text-white'
            }`}
          >
            <SearchCode className="w-4 h-4 text-[#0D9488]" />
            Track a request
          </Link>
          <div className="pt-2 border-t border-[#1E3A5F]">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white text-xs"
            >
              <Shield className="w-3.5 h-3.5" />
              Officer Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

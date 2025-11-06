'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';
import DisclaimerBanner from '@/components/DisclaimerBanner';
import AuthButton from '@/components/AuthButton';
import LegalAcceptanceModal from '@/components/LegalAcceptanceModal';

interface SearchResult {
  id: string;
  doi: string;
  title: string;
  publicationYear: number;
  authors: string[];
  journal: string;
  citationCount: number;
}

export default function Home() {
  const [inputMode, setInputMode] = useState<'doi' | 'title'>('doi');
  const [doi, setDoi] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Auth and legal state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasAcceptedLegal, setHasAcceptedLegal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const supabase = createClient();

  // Check auth and legal acceptance on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        // Check if user has accepted legal terms
        try {
          const response = await fetch('/api/legal-acceptance');
          const data = await response.json();

          if (data.accepted) {
            setHasAcceptedLegal(true);
          } else {
            setShowLegalModal(true);
          }
        } catch (error) {
          console.error('Error checking legal acceptance:', error);
        }
      }

      setAuthLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user && !hasAcceptedLegal) {
        // New login - check legal acceptance
        fetch('/api/legal-acceptance')
          .then(res => res.json())
          .then(data => {
            if (!data.accepted) {
              setShowLegalModal(true);
            } else {
              setHasAcceptedLegal(true);
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Handle legal acceptance
  const handleLegalAccept = async () => {
    try {
      const response = await fetch('/api/legal-acceptance', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setHasAcceptedLegal(true);
        setShowLegalModal(false);
      } else {
        alert('Failed to record acceptance: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error recording legal acceptance:', error);
      alert('Failed to record acceptance. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication
    if (!user) {
      alert('Please sign in with Google to use this tool.');
      return;
    }

    // Check legal acceptance
    if (!hasAcceptedLegal) {
      setShowLegalModal(true);
      return;
    }

    if (inputMode === 'doi') {
      // DOI mode - directly analyze
      if (!doi.trim()) return;

      setLoading(true);

      try {
        // Log the search
        await fetch('/api/log-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            search_type: 'doi',
            search_query: doi.trim(),
            doi: doi.trim(),
          }),
        });

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doi: doi.trim() })
        });

        const data = await response.json();

        if (data.analysisId) {
          router.push(`/results/${data.analysisId}`);
        } else {
          alert('Analysis failed: ' + (data.error || 'Unknown error'));
          setLoading(false);
        }
      } catch (error) {
        alert('Network error. Please try again.');
        setLoading(false);
      }
    } else {
      // Title mode - go to confirmation page
      if (!title.trim() || title.trim().length < 3) return;

      // Log the search
      await fetch('/api/log-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search_type: 'title',
          search_query: title.trim(),
          paper_title: title.trim(),
        }),
      });

      router.push(`/confirm?title=${encodeURIComponent(title.trim())}`);
    }
  };

  // Autocomplete search as user types
  const handleTitleChange = async (value: string) => {
    setTitle(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Hide dropdown if input is too short
    if (value.trim().length < 3) {
      setShowDropdown(false);
      setSearchResults([]);
      return;
    }

    // Debounce search
    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: value.trim() })
        });

        const data = await response.json();

        if (data.success && data.results) {
          setSearchResults(data.results);
          setShowDropdown(data.results.length > 0);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearching(false);
      }
    }, 300); // 300ms debounce
  };

  // Handle clicking a search result
  const handleResultClick = async (result: SearchResult) => {
    if (!result.doi) {
      alert('This paper does not have a DOI. Cannot perform analysis.');
      return;
    }

    setShowDropdown(false);
    setLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doi: result.doi })
      });

      const data = await response.json();

      if (data.analysisId) {
        router.push(`/results/${data.analysisId}`);
      } else {
        alert('Analysis failed: ' + (data.error || 'Unknown error'));
        setLoading(false);
      }
    } catch (error) {
      alert('Network error. Please try again.');
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <LegalAcceptanceModal
        isOpen={showLegalModal}
        onAccept={handleLegalAccept}
      />
        {/* Navigation */}
        <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">PaperCredCheck</h1>
              <p className="text-xs text-slate-500">Research Integrity Platform</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="/disclaimer" className="hover:text-blue-600 transition-colors font-medium">Disclaimer</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</a>
            <a href="https://github.com/yourusername/papercredcheck" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">GitHub</a>
            <AuthButton />
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Disclaimer Banner */}
        <DisclaimerBanner />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 font-medium mb-6">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Powered by AI + Open Science APIs
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight font-libertine-display">
            Academic Journal
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Credibility Database
            </span>
          </h2>
          <p className="text-xl text-slate-700 mb-3 max-w-3xl mx-auto leading-relaxed">
            Independent database aggregator cross-referencing DOI citations against publicly compiled watchdog lists
          </p>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">
            Compiling data from 1,484 sources • Fuzzy matching via Llama 3.3 • Academic metadata from OpenAlex API
          </p>
        </div>

        {/* Main Card */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Start Your Analysis
              </h3>
              <p className="text-slate-600">
                Enter a DOI or search by paper title to verify all cited references instantly
              </p>
            </div>

            <div className="p-8">
              {/* Tabs */}
              <div className="flex gap-2 mb-8 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setInputMode('doi')}
                  className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    inputMode === 'doi'
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    DOI
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('title')}
                  className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    inputMode === 'title'
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Title Search
                  </span>
                </button>
              </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {inputMode === 'doi' ? (
              <div>
                <label htmlFor="doi" className="block text-sm font-semibold text-slate-700 mb-3">
                  Paper DOI
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="doi"
                    value={doi}
                    onChange={(e) => setDoi(e.target.value)}
                    placeholder="10.1038/s41586-020-2649-2"
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder-slate-400 transition-all"
                    disabled={loading}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Try example:
                  </p>
                  <button
                    type="button"
                    onClick={() => setDoi('10.1016/j.pmatsci.2004.04.001')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                  >
                    10.1016/j.pmatsci.2004.04.001
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-3">
                  Paper Title
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Recent progress in processing and properties of ZnO"
                    className="w-full pl-12 pr-12 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder-slate-400 transition-all"
                    disabled={loading}
                    autoComplete="off"
                  />
                  {searching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-500 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start typing to see live suggestions from OpenAlex
                </p>

                {/* Dropdown Results */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleResultClick(result)}
                        className="w-full text-left px-5 py-4 hover:bg-blue-50 border-b border-slate-100 last:border-b-0 focus:outline-none focus:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div className="text-sm font-medium truncate">
                                {result.title.startsWith('RETRACTED:') ? (
                                  <>
                                    <span className="text-red-600 font-bold">RETRACTED:</span>
                                    <span className="text-gray-900">{result.title.substring(10)}</span>
                                  </>
                                ) : (
                                  <span className="text-gray-900">{result.title}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-600">
                              Work by {result.authors.slice(0, 3).join(', ')}{result.authors.length > 3 ? ', et al.' : ''}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {result.journal} • {result.publicationYear}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="flex-shrink-0 w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`DOI: ${result.doi || 'Not available'}\nCitations: ${result.citationCount}\nOpenAlex ID: ${result.id}`);
                            }}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (inputMode === 'doi' ? !doi.trim() : !title.trim() || title.trim().length < 3)}
              className="group relative w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Analyzing references...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {inputMode === 'doi' ? 'Analyze References' : 'Search Papers'}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>
            {loading && (
              <p className="text-center text-sm text-slate-500 mt-3 animate-pulse">
                This may take 30-90 seconds for papers with many references
              </p>
            )}
          </form>

          {/* How It Works */}
          <div id="how-it-works" className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-1">Data Compilation Pipeline</h3>
                <p className="text-xs text-slate-600 mb-3">All data sourced from third-party public databases • No original determinations made</p>
                <ol className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Query OpenAlex API for DOI metadata & citation graph</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Cross-reference against retraction databases (Crossref/PubMed)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Fuzzy-match journal names using Llama 3.3 (95%+ confidence threshold)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <span>Compile findings from Beall's List, Stop Predatory Journals, Scopus</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                    <span>Generate aggregated report with source attribution</span>
                  </li>
                </ol>
                <p className="text-xs text-slate-500 mt-3 italic">Disclaimer: This tool compiles third-party data. Verify independently before making decisions.</p>
              </div>
            </div>
          </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">1,484</div>
              <div className="text-sm font-medium text-slate-600">Predatory Sources</div>
              <p className="text-xs text-slate-500 mt-2">Comprehensive database coverage</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">95%+</div>
              <div className="text-sm font-medium text-slate-600">AI Confidence</div>
              <p className="text-xs text-slate-500 mt-2">Powered by Llama AI</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">Free</div>
              <div className="text-sm font-medium text-slate-600">Open Source</div>
              <p className="text-xs text-slate-500 mt-2">100% transparent & free</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pb-12 border-t border-slate-200">
          <div className="max-w-4xl mx-auto pt-8">
            {/* Legal Disclaimer */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-center">
              <p className="text-xs text-gray-600 leading-relaxed max-w-3xl mx-auto">
                <strong className="text-gray-800">Independent Database Aggregator:</strong> PaperCredCheck compiles publicly available information from third-party sources for educational purposes only.
                We make no original determinations about journal quality. All information provided "as is" without warranties.
                Users must conduct independent verification. Not liable for decisions based on this information.
                {' '}<a href="/disclaimer" className="text-blue-600 hover:text-blue-800 underline font-medium">Full Legal Disclaimer →</a>
              </p>
            </div>

            {/* Data Sources */}
            <div className="text-center mb-6">
              <p className="text-sm text-slate-600 mb-2">
                <span className="font-semibold">Data Compiled From:</span> Beall's List (archived) • Stop Predatory Journals • Crossref Retraction Watch • PubMed • Scopus
              </p>
              <p className="text-sm text-slate-500">
                <span className="font-semibold">Technology:</span> Llama 3.3 AI (Groq) • OpenAlex API • Supabase • Next.js
              </p>
            </div>

            {/* Links */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
              <a href="/disclaimer" className="hover:text-blue-600 transition-colors font-medium">Legal Disclaimer</a>
              <span>•</span>
              <a href="https://github.com/yourusername/papercredcheck" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">GitHub</a>
              <span>•</span>
              <a href="https://openalex.org" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">OpenAlex</a>
            </div>

            <div className="mt-4 text-center text-xs text-slate-400">
              <p>© 2025 PaperCredCheck • Open Source Project • Educational Use Only</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

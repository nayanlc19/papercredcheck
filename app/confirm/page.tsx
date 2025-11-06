'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SearchResult {
  id: string;
  doi: string;
  title: string;
  publicationYear: number;
  authors: string[];
  journal: string;
  citationCount: number;
}

function ConfirmPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<SearchResult | null>(null);
  const title = searchParams.get('title');

  useEffect(() => {
    if (!title) {
      router.push('/');
      return;
    }

    // Fetch search results
    const searchPapers = async () => {
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title })
        });

        const data = await response.json();

        if (data.success && data.results) {
          setResults(data.results);
        } else {
          alert('Search failed: ' + (data.error || 'No results found'));
          router.push('/');
        }
      } catch (error) {
        alert('Network error. Please try again.');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    searchPapers();
  }, [title, router]);

  const handleConfirm = async (paper: SearchResult) => {
    if (!paper.doi) {
      alert('This paper does not have a DOI. Cannot perform analysis.');
      return;
    }

    setSelectedPaper(paper);
    setAnalyzing(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doi: paper.doi })
      });

      const data = await response.json();

      if (data.analysisId) {
        router.push(`/results/${data.analysisId}`);
      } else {
        alert('Analysis failed: ' + (data.error || 'Unknown error'));
        setAnalyzing(false);
        setSelectedPaper(null);
      }
    } catch (error) {
      alert('Network error. Please try again.');
      setAnalyzing(false);
      setSelectedPaper(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching for papers...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Select Paper to Analyze
          </h1>
          <p className="text-gray-600">
            Found {results.length} result{results.length !== 1 ? 's' : ''} for "{title}"
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-blue-600 hover:underline"
          >
            ← Back to search
          </button>
        </div>

        {/* Results */}
        {results.length === 0 ? (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
            <p className="text-gray-600">No papers found matching your search.</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700"
            >
              Try Another Search
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {results.map((paper) => (
              <div
                key={paper.id}
                className={`bg-white rounded-xl shadow-lg p-6 transition-all ${
                  analyzing && selectedPaper?.id === paper.id
                    ? 'ring-2 ring-blue-500'
                    : 'hover:shadow-xl'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    {/* Title */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {paper.title}
                    </h3>

                    {/* Authors */}
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Authors:</span>{' '}
                      {paper.authors.length > 0
                        ? paper.authors.join(', ')
                        : 'Unknown'}
                    </p>

                    {/* Journal & Year */}
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Journal:</span> {paper.journal} ({paper.publicationYear})
                    </p>

                    {/* DOI */}
                    {paper.doi ? (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">DOI:</span>{' '}
                        <a
                          href={`https://doi.org/${paper.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {paper.doi}
                        </a>
                      </p>
                    ) : (
                      <p className="text-sm text-red-600 mb-2">
                        <span className="font-medium">No DOI available</span> - Cannot analyze
                      </p>
                    )}

                    {/* Citations */}
                    <p className="text-sm text-gray-500">
                      📊 {paper.citationCount.toLocaleString()} citations
                    </p>
                  </div>

                  {/* Confirm Button */}
                  <div className="flex-shrink-0">
                    {analyzing && selectedPaper?.id === paper.id ? (
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-xs text-gray-600">Starting...</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConfirm(paper)}
                        disabled={!paper.doi || analyzing}
                        className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Analyze
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <ConfirmPageContent />
    </Suspense>
  );
}

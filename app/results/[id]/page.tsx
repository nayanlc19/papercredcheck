'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { AnalysisResult } from '@/lib/analyzer';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    async function loadAnalysis() {
      if (!params.id) return;

      try {
        const response = await fetch(`/api/analysis/${params.id}`);
        if (response.ok) {
          const result = await response.json();
          setAnalysis(result);
        } else {
          console.error('Failed to load analysis:', response.status);
        }
      } catch (error) {
        console.error('Failed to load analysis:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAnalysis();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Analysis Not Found</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'very-high': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-lime-100 text-lime-800 border-lime-300';
      default: return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analysis Results
          </h1>
          <p className="text-gray-600">
            DOI: {analysis.inputDoi}
          </p>
        </div>

        {/* Predatory Source Warning */}
        {analysis.inputJournalWarning && (
          <div className="mb-8 bg-red-50 border-2 border-red-300 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Predatory Publisher Detected
                </h3>
                <p className="text-red-800 mb-3">
                  {analysis.inputJournalWarning}
                </p>
                <p className="text-sm text-red-700">
                  This paper's credibility may be questionable. Predatory publishers often have weak peer review processes and may publish low-quality research. Consider evaluating this source carefully.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-gray-900">{analysis.totalReferences}</div>
            <div className="text-sm text-gray-500">Total References</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-red-600">{analysis.highRiskCount}</div>
            <div className="text-sm text-gray-500">High Risk</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600">{analysis.retractedCount}</div>
            <div className="text-sm text-gray-500">Retracted</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">
              {Math.round((analysis.totalReferences - analysis.highRiskCount) / analysis.totalReferences * 100)}%
            </div>
            <div className="text-sm text-gray-500">Safe References</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">{analysis.summary.veryHighRisk + analysis.summary.highRisk + analysis.summary.moderateRisk}</div>
            <div className="text-sm text-gray-500">Need Review</div>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Risk Distribution</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-32 text-sm text-gray-600">Very High</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-red-600 h-4 rounded-full"
                  style={{ width: `${(analysis.summary.veryHighRisk / analysis.totalReferences) * 100}%` }}
                ></div>
              </div>
              <div className="w-12 text-right text-sm font-semibold text-gray-900">{analysis.summary.veryHighRisk}</div>
            </div>
            <div className="flex items-center">
              <div className="w-32 text-sm text-gray-600">High</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-orange-600 h-4 rounded-full"
                  style={{ width: `${(analysis.summary.highRisk / analysis.totalReferences) * 100}%` }}
                ></div>
              </div>
              <div className="w-12 text-right text-sm font-semibold text-gray-900">{analysis.summary.highRisk}</div>
            </div>
            <div className="flex items-center">
              <div className="w-32 text-sm text-gray-600">Moderate</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-yellow-500 h-4 rounded-full"
                  style={{ width: `${(analysis.summary.moderateRisk / analysis.totalReferences) * 100}%` }}
                ></div>
              </div>
              <div className="w-12 text-right text-sm font-semibold text-gray-900">{analysis.summary.moderateRisk}</div>
            </div>
            <div className="flex items-center">
              <div className="w-32 text-sm text-gray-600">Low</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-lime-500 h-4 rounded-full"
                  style={{ width: `${(analysis.summary.lowRisk / analysis.totalReferences) * 100}%` }}
                ></div>
              </div>
              <div className="w-12 text-right text-sm font-semibold text-gray-900">{analysis.summary.lowRisk}</div>
            </div>
            <div className="flex items-center">
              <div className="w-32 text-sm text-gray-600">Minimal</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-green-600 h-4 rounded-full"
                  style={{ width: `${(analysis.summary.minimalRisk / analysis.totalReferences) * 100}%` }}
                ></div>
              </div>
              <div className="w-12 text-right text-sm font-semibold text-gray-900">{analysis.summary.minimalRisk}</div>
            </div>
          </div>
        </div>

        {/* References Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">All References</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Journal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analysis.scoredReferences.map((ref, idx) => (
                  <>
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${expandedRow === idx ? 'rotate-90' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <div>
                            <div className="text-sm text-gray-900 max-w-md truncate">
                              {ref.reference.title}
                            </div>
                            {ref.reference.doi && (
                              <div className="text-xs text-gray-500">{ref.reference.doi}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {ref.reference.hostVenue?.displayName || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {ref.reference.publicationYear || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${getRiskColor(ref.riskLevel.level)}`}>
                          {ref.riskLevel.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{ref.score.predatoryScore}/100</div>
                        {ref.score.matchConfidence > 0 && (
                          <div className="text-xs text-gray-500">{ref.score.matchConfidence}% confidence</div>
                        )}
                      </td>
                    </tr>
                    {expandedRow === idx && (
                      <tr key={`${idx}-details`}>
                        <td colSpan={5} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Assessment Details</h4>

                              {/* Retraction Info */}
                              {ref.retraction?.isRetracted && (
                                <div className="mb-3 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                                  <div className="font-bold text-lg text-red-900 mb-2">🚨 RETRACTED PAPER</div>

                                  <div className="text-sm text-red-800 mb-2">
                                    <span className="font-semibold">Detection Source:</span>{' '}
                                    {ref.retraction.retractionSource.map(s => s.toUpperCase()).join(' + ')}
                                  </div>

                                  {ref.retraction.detailedExplanation && (
                                    <div className="text-sm text-red-800 mb-3 leading-relaxed">
                                      {ref.retraction.detailedExplanation}
                                    </div>
                                  )}

                                  {ref.retraction.retractionReason && (
                                    <div className="text-sm text-red-700 mb-2">
                                      <span className="font-semibold">Reason:</span> {ref.retraction.retractionReason}
                                    </div>
                                  )}

                                  {ref.retraction.retractionDate && (
                                    <div className="text-sm text-red-700 mb-2">
                                      <span className="font-semibold">Retraction Date:</span>{' '}
                                      {new Date(ref.retraction.retractionDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </div>
                                  )}

                                  {ref.retraction.retractionNotice && (
                                    <div className="text-sm text-red-700 mb-2">
                                      <span className="font-semibold">Retraction Notice:</span> {ref.retraction.retractionNotice}
                                      {ref.retraction.noticeLink && (
                                        <span>
                                          {' '}
                                          <a
                                            href={ref.retraction.noticeLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-red-600 hover:text-red-800 underline font-medium"
                                          >
                                            View Notice →
                                          </a>
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  <div className="text-xs text-red-600 mt-3 pt-2 border-t border-red-200">
                                    ⚠️ Retracted papers should not be cited as valid research. They have been formally withdrawn from the scientific record.
                                  </div>
                                </div>
                              )}

                              {/* Evidence Sources */}
                              {ref.score.evidenceSources.length > 0 ? (
                                <div className="mb-2">
                                  <span className="text-sm font-medium text-gray-700">Evidence found in: </span>
                                  <span className="text-sm text-gray-600">
                                    {ref.score.evidenceSources.map(s => s.replace('-', ' ')).join(', ')}
                                  </span>
                                </div>
                              ) : (
                                <div className="mb-2 text-sm text-green-700">
                                  ✓ No matches found in predatory publisher databases (Beall's List, Stop Predatory Journals, Hijacked Journals, Scopus Discontinued)
                                </div>
                              )}

                              {/* Detailed Reasoning */}
                              {ref.score.details && ref.score.details.length > 0 && (
                                <div className="mt-2">
                                  <div className="text-xs font-medium text-gray-700 mb-1">Detailed Analysis:</div>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {ref.score.details.map((detail, i) => (
                                      <li key={i} className="pl-2">{detail}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Score Breakdown */}
                              {Object.keys(ref.score.scoreBreakdown).length > 0 && (
                                <div className="mt-2">
                                  <div className="text-xs font-medium text-gray-700 mb-1">Score Breakdown:</div>
                                  <div className="text-xs text-gray-600">
                                    {Object.entries(ref.score.scoreBreakdown).map(([key, value]) => (
                                      <div key={key}>• {key}: +{value} points</div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Risk Description */}
                              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                                <div className="text-xs text-blue-900">{ref.riskLevel.description}</div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              const csv = [
                ['Title', 'Journal', 'Year', 'Risk Level', 'Score', 'Confidence', 'Evidence Sources'],
                ...analysis.scoredReferences.map(ref => [
                  ref.reference.title || '',
                  ref.reference.hostVenue?.displayName || 'Unknown',
                  ref.reference.publicationYear || '',
                  ref.riskLevel.label,
                  ref.score.predatoryScore,
                  ref.score.matchConfidence,
                  ref.score.evidenceSources.join('; ')
                ])
              ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
              
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `papercredcheck-${analysis.inputDoi.replace(/[^a-z0-9]/gi, '_')}.csv`;
              a.click();
            }}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
          >
            Export to CSV
          </button>
        </div>
      </div>
    </main>
  );
}

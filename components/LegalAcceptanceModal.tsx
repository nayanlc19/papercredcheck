'use client';

import { useState } from 'react';

interface LegalAcceptanceModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export default function LegalAcceptanceModal({ isOpen, onAccept }: LegalAcceptanceModalProps) {
  const [hasRead, setHasRead] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (bottom) setHasScrolled(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Legal Disclaimer & Terms</h2>
          <p className="text-sm text-gray-600 mt-2">Please read and accept before proceeding</p>
        </div>

        {/* Scrollable Content */}
        <div
          className="p-6 overflow-y-auto flex-1"
          onScroll={handleScroll}
        >
          <div className="space-y-4 text-sm text-gray-700">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <h3 className="font-bold text-yellow-900 mb-2">⚠️ IMPORTANT NOTICE</h3>
              <p>
                <strong>PaperCredCheck is an independent academic database aggregator and information compiler
                for educational and research purposes only.</strong> We do not make original determinations
                about journal quality or publisher credibility.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">You Acknowledge and Agree:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>This service <strong>compiles publicly available information from third-party sources</strong></li>
                <li>We do NOT make original judgments or determinations about journals or publishers</li>
                <li>All information is provided <strong>"AS IS" without warranties of any kind</strong></li>
                <li>You must conduct <strong>independent verification</strong> before making decisions</li>
                <li>This tool is for <strong>educational purposes only</strong></li>
                <li>We are NOT liable for decisions made based on this information</li>
                <li>Journal listings in watchdog databases do NOT automatically mean all published papers are invalid</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Data Sources:</h3>
              <p className="text-xs">
                Information compiled from: Beall's List (archived), Stop Predatory Journals,
                Retraction Watch, PubMed, Scopus, OpenAlex API, and other publicly available databases.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">User Responsibility:</h3>
              <p>
                By using this service, you agree to use the information responsibly, verify all findings
                independently, and understand that this service does not replace professional academic judgment.
              </p>
            </div>

            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <h3 className="font-bold text-red-900 mb-2">Limitation of Liability</h3>
              <p className="text-xs">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, PaperCredCheck and its operators shall not be
                liable for any direct, indirect, incidental, special, consequential, or punitive damages
                arising from your use of this service.
              </p>
            </div>

            <div className="text-center text-xs text-gray-500 mt-6">
              <a href="/disclaimer" target="_blank" className="text-blue-600 hover:underline">
                Read Full Legal Disclaimer →
              </a>
            </div>
          </div>
        </div>

        {/* Footer with Accept Button */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-start mb-4">
            <input
              type="checkbox"
              id="confirm-read"
              checked={hasRead}
              onChange={(e) => setHasRead(e.target.checked)}
              className="mt-1 mr-3 w-4 h-4"
            />
            <label htmlFor="confirm-read" className="text-sm text-gray-700 cursor-pointer">
              I have read and understood the disclaimer. I agree to independently verify all information
              before making decisions. I understand this service is for educational purposes only.
            </label>
          </div>

          {!hasScrolled && (
            <p className="text-xs text-amber-600 mb-3">
              ⚠️ Please scroll to the bottom of the disclaimer to continue
            </p>
          )}

          <button
            onClick={onAccept}
            disabled={!hasRead || !hasScrolled}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
              hasRead && hasScrolled
                ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

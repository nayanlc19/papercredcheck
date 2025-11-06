export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">Legal Disclaimer & Terms of Use</h1>

          {/* Critical Disclaimer Box */}
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-yellow-900 mb-4">⚠️ IMPORTANT NOTICE</h2>
            <p className="text-gray-800 leading-relaxed">
              <strong>PaperCredCheck is an independent academic database aggregator and information compiler for educational and research purposes only.</strong> We do not make original determinations about journal quality or publisher credibility. All information presented is compiled from publicly available third-party sources.
            </p>
          </div>

          {/* Nature of Service */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">1. Nature of Service</h2>
            <div className="space-y-4 text-gray-700">
              <p>PaperCredCheck is a <strong>data aggregation and compilation tool</strong> that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Compiles information from multiple publicly available academic databases and watchdog organizations</li>
                <li>Does NOT make original judgments or determinations about journals or publishers</li>
                <li>Does NOT endorse or verify the accuracy of third-party data sources</li>
                <li>Presents information "as-is" from external sources including:
                  <ul className="list-circle pl-6 mt-2 space-y-1">
                    <li>Beall's List of Potential Predatory Journals and Publishers (archived public data)</li>
                    <li>Stop Predatory Journals database</li>
                    <li>Retraction Watch / Crossref / PubMed retraction databases</li>
                    <li>Scopus discontinued journal lists</li>
                    <li>OpenAlex academic metadata API</li>
                  </ul>
                </li>
              </ul>
            </div>
          </section>

          {/* No Warranties */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">2. No Warranties or Guarantees</h2>
            <div className="space-y-4 text-gray-700">
              <p><strong>WE MAKE NO WARRANTIES, EXPRESS OR IMPLIED, ABOUT:</strong></p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The accuracy, completeness, or reliability of any information presented</li>
                <li>The validity of third-party determinations or classifications</li>
                <li>The current status of any journal, publisher, or paper</li>
                <li>Fitness for any particular purpose</li>
              </ul>
              <p className="mt-4 font-semibold">
                ALL INFORMATION IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF ANY KIND.
              </p>
            </div>
          </section>

          {/* User Responsibility */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">3. User Responsibility</h2>
            <div className="space-y-4 text-gray-700">
              <p>Users of this service acknowledge and agree that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Independent Verification Required:</strong> You must conduct your own independent research and verification before making any decisions</li>
                <li><strong>Educational Purpose Only:</strong> This tool is for educational and informational purposes only</li>
                <li><strong>No Substitute for Professional Judgment:</strong> This service does not replace professional academic judgment or peer review</li>
                <li><strong>Context Matters:</strong> Journal listings in watchdog databases do not automatically mean all published papers are invalid</li>
                <li><strong>No Liability:</strong> We are not responsible for any decisions made based on information from this service</li>
              </ul>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">4. Limitation of Liability</h2>
            <div className="space-y-4 text-gray-700">
              <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong></p>
              <ul className="list-disc pl-6 space-y-2">
                <li>PaperCredCheck and its operators shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages</li>
                <li>We are not liable for decisions made based on information compiled from third-party sources</li>
                <li>We are not liable for any errors, omissions, or inaccuracies in third-party data</li>
                <li>Use of this service is entirely at your own risk</li>
              </ul>
            </div>
          </section>

          {/* No Defamation Intent */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">5. No Defamation Intent</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                This service compiles publicly available information from third-party academic watchdog organizations and databases.
                We do not make original claims about any journal, publisher, or individual. All determinations and classifications
                are made by the original source databases, not by PaperCredCheck.
              </p>
              <p>
                <strong>We do not intend to defame any person, journal, or publisher.</strong> Any concerns about specific listings
                should be directed to the original data source maintainers.
              </p>
            </div>
          </section>

          {/* Academic Freedom */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">6. Academic Freedom & Fair Use</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                This service exists to support academic freedom and the free exchange of information for educational purposes.
                We compile publicly available data under principles of fair use and academic inquiry.
              </p>
              <p>
                <strong>Protected Activities:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Compilation of publicly available information</li>
                <li>Educational and research use of academic metadata</li>
                <li>Facilitating informed decision-making in academia</li>
              </ul>
            </div>
          </section>

          {/* Data Sources Attribution */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">7. Data Sources & Attribution</h2>
            <div className="space-y-4 text-gray-700">
              <p><strong>All data is compiled from third-party sources:</strong></p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Beall's List:</strong> Archived public data from Dr. Jeffrey Beall's research (no longer maintained)</li>
                <li><strong>Stop Predatory Journals:</strong> Independent watchdog database</li>
                <li><strong>Retraction Watch:</strong> Database of retracted publications via Crossref</li>
                <li><strong>PubMed:</strong> U.S. National Library of Medicine retraction data</li>
                <li><strong>Scopus:</strong> Elsevier's discontinued journal information</li>
                <li><strong>OpenAlex:</strong> Open academic metadata API</li>
              </ul>
              <p className="mt-4">
                We acknowledge these sources and make no claim of ownership over their determinations or classifications.
              </p>
            </div>
          </section>

          {/* Removal Requests */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">8. Data Correction & Removal Requests</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Since we compile data from third-party sources, we do not have authority to remove or modify entries.
                If you believe information about your journal or publisher is incorrect, please contact the original data source:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Beall's List:</strong> Now archived; no longer accepting submissions</li>
                <li><strong>Stop Predatory Journals:</strong> Contact their maintainers directly</li>
                <li><strong>Retraction Watch:</strong> Contact via their official website</li>
              </ul>
              <p className="mt-4">
                We will update our compiled data when official source databases are updated.
              </p>
            </div>
          </section>

          {/* Indemnification */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">9. Indemnification</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                You agree to indemnify and hold harmless PaperCredCheck, its operators, and contributors from any claims,
                damages, or expenses arising from your use of this service or reliance on compiled information.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">10. Changes to Terms</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">11. Contact Information</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                For questions about these terms or this service, please contact us through our GitHub repository.
              </p>
            </div>
          </section>

          {/* Acceptance */}
          <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-6 mt-8">
            <h2 className="text-xl font-bold text-blue-900 mb-3">Acceptance of Terms</h2>
            <p className="text-gray-800">
              <strong>By using PaperCredCheck, you acknowledge that you have read, understood, and agree to be bound by these terms.</strong>
              If you do not agree to these terms, please do not use this service.
            </p>
          </div>

          {/* Last Updated */}
          <div className="mt-8 text-sm text-gray-600 text-center">
            <p>Last Updated: November 2025</p>
            <p>Version 1.0</p>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Homepage
          </a>
        </div>
      </div>
    </main>
  );
}

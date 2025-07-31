import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '../../components/Common/PageTitle';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="p-4">
        <div className="bg-white rounded-xl p-3 font-title">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          
          <PageTitle title="Terms of Service" />
          <p className="text-gray-600 mt-2 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using LogiSlip ("the Service"), you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to these Terms of Service, please do not 
                use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Description of Service</h2>
              <p className="text-gray-700 mb-4">
                LogiSlip is a comprehensive web-based invoice management application that allows users to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Create, edit, and manage professional invoices with customizable templates</li>
                <li>Track and manage client/customer information and contact details</li>
                <li>Maintain product and service catalogs with pricing and descriptions</li>
                <li>Generate invoices in PDF format for sharing and printing</li>
                <li>Synchronize data across devices using cloud storage (Google Drive)</li>
                <li>Export invoices via email (Gmail integration)</li>
                <li>Store data locally in the browser for offline access</li>
                <li>Backup and restore data using cloud synchronization</li>
                <li>Access multiple invoice templates (Modern, Formal, Default)</li>
                <li>Manage company profile and branding information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">User Accounts and Registration</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Account Creation</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must be at least 18 years old to create an account</li>
                <li>You may not create multiple accounts or share your account with others</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Account Security</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized access</li>
                <li>We reserve the right to suspend accounts that violate these terms</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptable Use Policy</h2>
              <p className="text-gray-700 mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit malicious code or spam</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Create fraudulent or misleading invoices</li>
                <li>Harass, threaten, or harm others</li>
                <li>Use the service for illegal financial activities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription and Payment Terms</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Service Plans</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>LogiSlip currently offers free access to core invoice management features</li>
                <li>Premium features may be introduced in the future with advance notice</li>
                <li>Any subscription fees will be clearly communicated before implementation</li>
                <li>We reserve the right to introduce paid features with reasonable notice</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Data Storage and Backup</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Local data storage in your browser is provided at no cost</li>
                <li>Cloud synchronization uses your own Google Drive storage</li>
                <li>You are responsible for your Google Drive storage limits</li>
                <li>We do not charge for cloud backup features</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Future Premium Features</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Premium features, if introduced, will be optional</li>
                <li>Core invoice functionality will remain free</li>
                <li>30 days advance notice will be provided for any pricing changes</li>
                <li>Existing users will receive grandfathered access to current features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Ownership and Privacy</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Data</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>You retain ownership of all data you submit to the Service</li>
                <li>You grant us a license to use your data to provide the Service</li>
                <li>You are responsible for the accuracy and legality of your data</li>
                <li>You may export your data at any time</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Data Protection</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>We implement industry-standard security measures</li>
                <li>We comply with applicable data protection regulations</li>
                <li>See our Privacy Policy for detailed information</li>
                <li>We may anonymize data for analytics and improvement</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Our Rights</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>We own all rights to the Service and its technology</li>
                <li>Our trademarks and logos are protected intellectual property</li>
                <li>You may not copy, modify, or distribute our software</li>
                <li>You may not reverse engineer or attempt to extract our code</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Rights</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>You retain rights to your original content and data</li>
                <li>You may use our service in accordance with these terms</li>
                <li>You may not claim ownership of our intellectual property</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Availability and Support</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Uptime and Maintenance</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>We strive for 99.9% uptime but cannot guarantee continuous availability</li>
                <li>Scheduled maintenance will be announced in advance when possible</li>
                <li>We are not liable for service interruptions beyond our control</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Customer Support</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Support is provided via email and in-app messaging</li>
                <li>Response times vary by subscription plan</li>
                <li>We provide documentation and tutorials for self-help</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitations of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>We provide the Service "as is" without warranties</li>
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>Our total liability is limited to the amount you paid in the last 12 months</li>
                <li>We are not responsible for third-party services or content</li>
                <li>You use the Service at your own risk</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Indemnification</h2>
              <p className="text-gray-700 mb-4">
                You agree to indemnify and hold us harmless from any claims, damages, losses, or 
                expenses arising from:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Your use of the Service</li>
                <li>Your violation of these terms</li>
                <li>Your infringement of third-party rights</li>
                <li>Your data or content submitted to the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Termination</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Termination by You</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>You may terminate your account at any time</li>
                <li>Termination does not relieve you of payment obligations</li>
                <li>You should export your data before termination</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Termination by Us</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>We may terminate accounts that violate these terms</li>
                <li>We may suspend service for non-payment</li>
                <li>We may discontinue the Service with 30 days notice</li>
                <li>We will provide data export opportunities when possible</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law and Disputes</h2>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>These terms are governed by the laws of India</li>
                <li>Disputes will be resolved through binding arbitration in Bangalore, India</li>
                <li>You waive your right to participate in class actions</li>
                <li>Injunctive relief may be sought in any court of competent jurisdiction</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We may modify these terms at any time. Material changes will be notified via:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Email notification to your registered address</li>
                <li>Prominent notice in the application</li>
                <li>Updated "last modified" date on this page</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Continued use of the Service after changes constitutes acceptance of new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong> nsanni29@gmail.com
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Address:</strong> #14, 2nd main, Indiragandhi street, Bangalore 560016
                </p>
                <p className="text-gray-700">
                  <strong>Phone:</strong> +91 9535354685
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Severability</h2>
              <p className="text-gray-700 mb-4">
                If any provision of these terms is found to be unenforceable, the remaining 
                provisions will continue to be valid and enforceable.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 
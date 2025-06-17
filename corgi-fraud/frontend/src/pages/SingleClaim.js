import React, { useState, useCallback } from 'react';
import { DocumentTextIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon, DocumentArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const SingleClaim = () => {
  const [formData, setFormData] = useState({
    claimant: '',
    claim_text: '',
    claim_amount: '',
    date_of_incident: '',
    policy_number: '',
    contact_email: '',
    supporting_docs: '',
    medical_codes: '',
    location: '',
    transaction_hashes: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    setUploadingFiles(true);
    setError(null);
    
    try {
      const uploadFormData = new FormData();
      acceptedFiles.forEach(file => {
        uploadFormData.append('files', file);
      });
      
      const response = await axios.post('/api/upload-documents', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUploadedFiles(prev => [...prev, ...response.data.files]);
      
      // Update supporting_docs field with uploaded filenames
      const currentDocs = formData.supporting_docs ? formData.supporting_docs.split(', ') : [];
      const newDocs = response.data.files.map(f => f.filename);
      const allDocs = [...currentDocs, ...newDocs].filter(Boolean);
      
      setFormData(prev => ({
        ...prev,
        supporting_docs: allDocs.join(', ')
      }));
      
    } catch (error) {
      setError('Failed to upload files: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploadingFiles(false);
    }
  }, [formData.supporting_docs]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (fileIndex) => {
    const newFiles = uploadedFiles.filter((_, index) => index !== fileIndex);
    setUploadedFiles(newFiles);
    
    // Update supporting_docs field
    const docNames = newFiles.map(f => f.filename);
    setFormData(prev => ({
      ...prev,
      supporting_docs: docNames.join(', ')
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic form validation
    if (!formData.claimant.trim()) {
      setError('Claimant name is required');
      return;
    }
    
    if (!formData.claim_text.trim()) {
      setError('Claim description is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Prepare data, converting empty strings to null
      const submitData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key,
          value === '' ? null : (key === 'claim_amount' && value ? parseFloat(value) : value)
        ])
      );

      const response = await axios.post('/api/analyze-claim', submitData);
      setResult(response.data);
    } catch (error) {
      setError(error.response?.data?.detail || 'An error occurred while processing the claim');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      claimant: '',
      claim_text: '',
      claim_amount: '',
      date_of_incident: '',
      policy_number: '',
      contact_email: '',
      supporting_docs: '',
      medical_codes: '',
      location: '',
      transaction_hashes: ''
    });
    setUploadedFiles([]);
    setResult(null);
    setError(null);
  };

  const getDecisionColor = (decision) => {
    switch (decision) {
      case 'APPROVE':
        return 'text-success-600 bg-success-50';
      case 'REJECT':
        return 'text-danger-600 bg-danger-50';
      case 'ESCALATE':
        return 'text-warning-600 bg-warning-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getDecisionIcon = (decision) => {
    switch (decision) {
      case 'APPROVE':
        return CheckCircleIcon;
      case 'REJECT':
        return ExclamationTriangleIcon;
      case 'ESCALATE':
        return ClockIcon;
      default:
        return DocumentTextIcon;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Single Claim Analysis
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500">
            Submit a single insurance claim for AI-powered fraud detection
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white shadow-lg rounded-lg card-shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Claim Information</h3>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Claimant Name *
                </label>
                <input
                  type="text"
                  name="claimant"
                  value={formData.claimant}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Claim Description *
                </label>
                <textarea
                  name="claim_text"
                  value={formData.claim_text}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Describe the incident or claim in detail..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Claim Amount ($)
                  </label>
                  <input
                    type="number"
                    name="claim_amount"
                    value={formData.claim_amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    max="1000000"
                    placeholder="0.00"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Incident
                  </label>
                  <input
                    type="date"
                    name="date_of_incident"
                    value={formData.date_of_incident}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    name="policy_number"
                    value={formData.policy_number}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supporting Documents
                </label>
                
                {/* File Upload Drop Zone */}
                <div
                  {...getRootProps()}
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="space-y-1 text-center">
                    <input {...getInputProps()} />
                    <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <p className="pl-1">
                        {isDragActive
                          ? "Drop the files here..."
                          : "Drag and drop files here, or click to select files"}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, TXT, Images up to 10MB
                    </p>
                  </div>
                </div>

                {/* Upload Progress */}
                {uploadingFiles && (
                  <div className="mt-2 flex items-center text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                    Uploading files...
                  </div>
                )}

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{file.filename}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Manual Input Fallback */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-500">
                    Or enter document names manually:
                  </label>
                  <input
                    type="text"
                    name="supporting_docs"
                    value={formData.supporting_docs}
                    onChange={handleChange}
                    placeholder="e.g., police_report.pdf, medical_records.pdf"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Medical Codes
                </label>
                <input
                  type="text"
                  name="medical_codes"
                  value={formData.medical_codes}
                  onChange={handleChange}
                  placeholder="e.g., ICD-10:S72.8X1A, CPT:99214"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location (Lat, Long)
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., 40.7128,-74.0060"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Transaction Hashes
                </label>
                <input
                  type="text"
                  name="transaction_hashes"
                  value={formData.transaction_hashes}
                  onChange={handleChange}
                  placeholder="e.g., 0xabc...123"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loading ? 'Analyzing...' : 'Analyze Claim'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {loading && (
              <div className="bg-white shadow-lg rounded-lg card-shadow p-6">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <div className="ml-3">
                    <span className="text-gray-600 font-medium">AI Multi-Agent Analysis in Progress...</span>
                    <div className="text-sm text-gray-500 mt-1">
                      Our AI agents are analyzing your claim for fraud patterns
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-400 text-center">
                  This may take 30-60 seconds depending on claim complexity
                </div>
              </div>
            )}

            {error && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-danger-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-danger-800">Error</h3>
                    <div className="mt-2 text-sm text-danger-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Decision */}
                <div className="bg-white shadow-lg rounded-lg card-shadow p-6">
                  <div className="flex items-center">
                    {React.createElement(getDecisionIcon(result.decision), {
                      className: `h-8 w-8 ${getDecisionColor(result.decision).split(' ')[0]}`
                    })}
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">Decision</h3>
                      <div className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${getDecisionColor(result.decision)}`}>
                        {result.decision}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Confidence</div>
                      <div className="text-lg font-medium">{(result.confidence * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Processing Time</div>
                      <div className="text-lg font-medium">{result.processing_time.toFixed(2)}s</div>
                    </div>
                  </div>
                </div>

                {/* Agent Scores */}
                <div className="bg-white shadow-lg rounded-lg card-shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Agent Analysis</h3>
                  <div className="space-y-3">
                    {result.agent_scores.scores && Object.entries(result.agent_scores.scores).map(([agent, score]) => (
                      <div key={agent} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 capitalize">{agent}</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                            <div
                              className={`h-2 rounded-full ${score >= 0.7 ? 'bg-danger-500' : score >= 0.5 ? 'bg-warning-500' : 'bg-success-500'}`}
                              style={{ width: `${score * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{(score * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Factors */}
                {result.risk_factors && result.risk_factors.length > 0 && (
                  <div className="bg-white shadow-lg rounded-lg card-shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Factors</h3>
                    <ul className="space-y-2">
                      {result.risk_factors.map((factor, idx) => (
                        <li key={idx} className="flex items-start">
                          <ExclamationTriangleIcon className="h-5 w-5 text-danger-500 mt-0.5 mr-2" />
                          <span className="text-sm text-gray-700">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div className="bg-white shadow-lg rounded-lg card-shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircleIcon className="h-5 w-5 text-primary-500 mt-0.5 mr-2" />
                          <span className="text-sm text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleClaim;

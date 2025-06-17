import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentArrowUpIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const BatchProcess = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const response = await axios.post('/api/upload-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setTaskId(response.data.task_id);
      setTaskStatus(response.data);
      setPolling(true);
      pollTaskStatus(response.data.task_id);
    } catch (error) {
      setError(error.response?.data?.detail || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const pollTaskStatus = async (id) => {
    try {
      const response = await axios.get(`/api/batch-status/${id}`);
      setTaskStatus(response.data);

      if (response.data.status === 'processing') {
        setTimeout(() => pollTaskStatus(id), 3000);
      } else {
        setPolling(false);
      }
    } catch (error) {
      setError('Failed to check task status');
      setPolling(false);
    }
  };

  const downloadResults = async () => {
    if (!taskId) return;

    try {
      const response = await axios.get(`/api/download-results/${taskId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fraud_analysis_results_${taskId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('Failed to download results');
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await axios.get('/api/generate-template', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'claims_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('Failed to download template');
    }
  };

  const downloadSampleData = async () => {
    try {
      const response = await axios.get('/api/generate-sample-data', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample_claims.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('Failed to download sample data');
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setTaskId(null);
    setTaskStatus(null);
    setError(null);
    setPolling(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success-600 bg-success-50';
      case 'failed':
        return 'text-danger-600 bg-danger-50';
      case 'processing':
        return 'text-warning-600 bg-warning-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return CheckCircleIcon;
      case 'failed':
        return ExclamationTriangleIcon;
      case 'processing':
        return DocumentTextIcon;
      default:
        return DocumentTextIcon;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Batch Processing
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500">
            Upload an Excel file with multiple claims for bulk fraud analysis
          </p>
        </div>

        {/* Download Options */}
        <div className="bg-white shadow-lg rounded-lg card-shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Getting Started</h3>
          </div>
          <div className="px-6 py-4">
            <p className="text-gray-600 mb-4">
              Download a template or sample data to get started with batch processing:
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={downloadTemplate}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Download Template
              </button>
              <button
                onClick={downloadSampleData}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Download Sample Data
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white shadow-lg rounded-lg card-shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Upload Claims File</h3>
            </div>
            <div className="px-6 py-4">
              {!uploadedFile ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {isDragActive
                      ? 'Drop the Excel file here...'
                      : 'Drag and drop an Excel file here, or click to select'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports .xlsx and .xls files
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-8 w-8 text-primary-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={resetUpload}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={handleUpload}
                      disabled={loading}
                      className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {loading ? 'Uploading...' : 'Start Processing'}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 bg-danger-50 border border-danger-200 rounded-lg p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-danger-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-danger-800">Error</h3>
                      <div className="mt-2 text-sm text-danger-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Section */}
          <div className="bg-white shadow-lg rounded-lg card-shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Processing Status</h3>
            </div>
            <div className="px-6 py-4">
              {!taskStatus ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Upload a file to start processing
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center">
                    {React.createElement(getStatusIcon(taskStatus.status), {
                      className: `h-6 w-6 ${getStatusColor(taskStatus.status).split(' ')[0]}`
                    })}
                    <div className="ml-3">
                      <div className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(taskStatus.status)}`}>
                        {taskStatus.status.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {taskStatus.status === 'processing' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing claims...</span>
                        <span>{taskStatus.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${taskStatus.progress || 0}%` }}
                        ></div>
                      </div>
                      {polling && (
                        <div className="flex items-center text-sm text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                          Refreshing status...
                        </div>
                      )}
                    </div>
                  )}

                  {taskStatus.status === 'completed' && (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        Processing completed at {new Date(taskStatus.completed_at).toLocaleString()}
                      </div>
                      <button
                        onClick={downloadResults}
                        className="w-full bg-success-600 text-white py-2 px-4 rounded-md hover:bg-success-700 focus:outline-none focus:ring-2 focus:ring-success-500"
                      >
                        Download Results
                      </button>
                    </div>
                  )}

                  {taskStatus.status === 'failed' && (
                    <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                      <div className="text-sm text-danger-800">
                        Processing failed: {taskStatus.error}
                      </div>
                      <div className="text-xs text-danger-600 mt-1">
                        Failed at {new Date(taskStatus.completed_at).toLocaleString()}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Task ID: {taskId}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Upload an Excel file (.xlsx or .xls) with claim data</li>
            <li>• Required columns: ClaimID, Claimant, ClaimText</li>
            <li>• Optional columns: DateOfIncident, ClaimAmount, PolicyNumber, ContactEmail, etc.</li>
            <li>• The system will analyze each claim using multiple AI agents</li>
            <li>• Results will be available for download once processing is complete</li>
            <li>• Download the template above to see the exact format required</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BatchProcess;

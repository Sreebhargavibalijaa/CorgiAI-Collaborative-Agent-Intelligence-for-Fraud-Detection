import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentArrowUpIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import useWebSocket from '../hooks/useWebSocket';
import ProgressDisplay from '../components/ProgressDisplay';

const BatchProcess = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use WebSocket hook for real-time updates
  const {
    progress,
    status,
    currentStep,
    connectionStatus,
    logs,
    isConnected,
    error: wsError,
    manualReconnect,
    reconnectAttempts,
    maxReconnectAttempts
  } = useWebSocket(taskId);

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

      // Set task ID to start WebSocket connection
      setTaskId(response.data.task_id);
      setLoading(false);
      
    } catch (error) {
      setError(error.response?.data?.detail || 'Upload failed');
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!taskId) return;

    try {
      const response = await axios.get(`/api/download-results/${taskId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `processed_claims_${taskId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Download failed');
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
      window.URL.revokeObjectURL(url);
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
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download sample data');
    }
  };

  const resetForm = () => {
    setUploadedFile(null);
    setTaskId(null);
    setError(null);
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Batch Processing
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500">
            Upload an Excel file with multiple claims for bulk fraud analysis with real-time updates
          </p>
        </div>

        {/* Download Options */}
        <div className="bg-white shadow-lg rounded-lg mb-8">
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
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Download Template
              </button>
              <button
                onClick={downloadSampleData}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Download Sample Data
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white shadow-lg rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Upload Claims File</h3>
            </div>
            <div className="px-6 py-4">
              {!uploadedFile ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50'
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
                      <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={resetForm}
                      className="text-gray-400 hover:text-gray-600 text-xl"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={handleUpload}
                      disabled={loading || taskId}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Uploading...' : taskId ? 'Processing...' : 'Start Processing'}
                    </button>
                  </div>
                </div>
              )}

              {(error || wsError) && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">{error || wsError}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Progress Section */}
          <div className="bg-white shadow-lg rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Real-time Processing Status</h3>
            </div>
            <div className="px-6 py-4">
              {!taskId ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Upload a file to start real-time processing
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    You'll see live updates here once processing begins
                  </p>
                </div>
              ) : (
                <ProgressDisplay
                  progress={progress}
                  status={status}
                  currentStep={currentStep}
                  connectionStatus={connectionStatus}
                  logs={logs}
                  isConnected={isConnected}
                  error={wsError}
                  manualReconnect={manualReconnect}
                  reconnectAttempts={reconnectAttempts}
                  maxReconnectAttempts={maxReconnectAttempts}
                />
              )}
            </div>
          </div>
        </div>

        {/* Download Results */}
        {status === 'completed' && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-green-900">Processing Complete!</h3>
                  <p className="text-sm text-green-700">Your fraud analysis results are ready for download.</p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              >
                <ArrowDownTrayIcon className="h-5 w-5 inline mr-2" />
                Download Results
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">File Requirements:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Excel format (.xlsx or .xls)</li>
                <li>• Required: ClaimID, Claimant, ClaimText</li>
                <li>• Optional: DateOfIncident, ClaimAmount, PolicyNumber, etc.</li>
                <li>• Use the template above for correct format</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Real-time Features:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Live progress updates via WebSocket</li>
                <li>• Step-by-step processing logs</li>
                <li>• Automatic reconnection if connection drops</li>
                <li>• Multi-agent AI fraud detection</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Task ID Display */}
        {taskId && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Task ID: <code className="bg-gray-100 px-2 py-1 rounded">{taskId}</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchProcess;

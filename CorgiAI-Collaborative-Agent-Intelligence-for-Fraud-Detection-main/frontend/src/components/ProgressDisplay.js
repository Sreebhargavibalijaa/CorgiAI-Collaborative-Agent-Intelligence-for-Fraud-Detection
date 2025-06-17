import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, SignalIcon, SignalSlashIcon } from '@heroicons/react/24/outline';

const ProgressDisplay = ({ 
  progress, 
  status, 
  currentStep, 
  connectionStatus, 
  logs, 
  isConnected,
  error,
  manualReconnect,
  reconnectAttempts,
  maxReconnectAttempts
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'processing':
        return (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        );
      default:
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getProgressColor = () => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'failed') return 'bg-red-500';
    if (status === 'processing') return 'bg-blue-500';
    return 'bg-gray-300';
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <SignalIcon className="h-5 w-5 text-green-500" />
          ) : (
            <SignalSlashIcon className="h-5 w-5 text-red-500" />
          )}
          <span className={`text-sm font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
            {connectionStatus}
          </span>
          {!isConnected && reconnectAttempts > 0 && (
            <span className="text-xs text-gray-600">
              (Attempt {reconnectAttempts}/{maxReconnectAttempts})
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? 'Real-time Updates Active' : 'Connection Lost'}
          </div>
          {!isConnected && manualReconnect && status === 'processing' && (
            <button
              onClick={manualReconnect}
              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm font-medium text-gray-700">
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Waiting...'}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-600">
            {progress}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {currentStep && (
          <p className="text-sm text-gray-600 italic">
            {currentStep}
          </p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <XCircleIcon className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-red-800">Error</span>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Real-time Logs */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
          <span>Processing Log</span>
          {isConnected && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Live
            </span>
          )}
        </h4>
        
        <div className="bg-gray-900 rounded-lg p-4 max-h-60 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm">No logs yet...</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start space-x-2 text-sm">
                  <span className="text-gray-400 text-xs mt-0.5 w-16 flex-shrink-0">
                    {log.timestamp}
                  </span>
                  <span className="flex-shrink-0">{getLogIcon(log.type)}</span>
                  <span className={`${getLogColor(log.type)} font-mono text-xs`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Processing Stats */}
      {status === 'processing' && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-700">{progress}%</div>
            <div className="text-xs text-blue-600">Complete</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-700">
              {isConnected ? 'Live' : 'Offline'}
            </div>
            <div className="text-xs text-blue-600">Connection</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-700">{logs.length}</div>
            <div className="text-xs text-blue-600">Log Entries</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressDisplay;

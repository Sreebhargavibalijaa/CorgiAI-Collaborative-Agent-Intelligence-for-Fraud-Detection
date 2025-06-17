import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = (taskId) => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = 3000;

  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { 
      id: Date.now(), 
      message, 
      type, 
      timestamp 
    }].slice(-50)); // Keep only last 50 logs
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!taskId || socket?.readyState === WebSocket.OPEN) return;

    try {
      // Use the backend URL directly since WebSocket doesn't go through React dev server proxy
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//localhost:8000/ws/${taskId}`;
      
      addLog(`Attempting to connect to WebSocket...`, 'info');
      const newSocket = new WebSocket(wsUrl);
      
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (newSocket.readyState === WebSocket.CONNECTING) {
          newSocket.close();
          addLog('❌ Connection timeout', 'error');
          
          // Retry connection if not at max attempts
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            addLog(`🔄 Retrying connection... (${reconnectAttempts.current}/${maxReconnectAttempts})`, 'warning');
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, reconnectInterval);
          }
        }
      }, 10000); // 10 second timeout
      
      newSocket.onopen = () => {
        clearTimeout(connectionTimeout);
        setConnectionStatus('Connected');
        setSocket(newSocket);
        reconnectAttempts.current = 0;
        addLog(`✅ Connected to batch processing for task: ${taskId}`, 'success');
        
        // Send a ready message to the server (optional)
        try {
          newSocket.send(JSON.stringify({
            type: 'client_ready',
            task_id: taskId,
            timestamp: new Date().toISOString()
          }));
        } catch (err) {
          // Don't fail if we can't send ready message
          console.warn('Could not send ready message:', err);
        }
      };

      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          
          // Handle different message types
          switch (data.type) {
            case 'connection_established':
              addLog(data.message, 'success');
              break;
              
            case 'heartbeat':
              // Don't log heartbeat messages as they're just keepalive
              break;
              
            case 'progress':
              setProgress(data.progress || 0);
              setStatus(data.status || '');
              setCurrentStep(data.message || '');
              addLog(`${data.progress}% - ${data.message}`, 'info');
              break;
              
            case 'completed':
              setProgress(100);
              setStatus('completed');
              setCurrentStep(data.message || 'Processing completed');
              addLog(`✅ ${data.message}`, 'success');
              if (data.processing_time) {
                addLog(`Processing completed in ${data.processing_time}`, 'info');
              }
              break;
              
            case 'error':
              setError(data.error || 'Unknown error occurred');
              setStatus('failed');
              setCurrentStep(`Error: ${data.error}`);
              addLog(`❌ Error: ${data.error}`, 'error');
              break;
              
            default:
              addLog(`Received: ${data.message || JSON.stringify(data)}`, 'info');
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          addLog('Error parsing server message', 'error');
        }
      };

      newSocket.onclose = (event) => {
        clearTimeout(connectionTimeout);
        setConnectionStatus('Disconnected');
        setSocket(null);
        
        const wasClean = event.wasClean;
        const code = event.code;
        const reason = event.reason || 'Unknown';
        
        if (wasClean) {
          addLog('✅ Connection closed cleanly', 'info');
        } else {
          addLog(`⚠️ Connection lost (Code: ${code}, Reason: ${reason})`, 'warning');
        }
        
        // Only attempt to reconnect if:
        // 1. Not completed or failed
        // 2. Not a clean close (user didn't intentionally disconnect)
        // 3. Not at max reconnection attempts
        // 4. Not a client-side close (code 1000-1003)
        const shouldReconnect = (
          status !== 'completed' && 
          status !== 'failed' && 
          !wasClean &&
          code !== 1000 && code !== 1001 && code !== 1002 && code !== 1003 &&
          reconnectAttempts.current < maxReconnectAttempts
        );
        
        if (shouldReconnect) {
          reconnectAttempts.current++;
          const delay = Math.min(reconnectInterval * reconnectAttempts.current, 30000); // Max 30s delay
          addLog(`🔄 Attempting to reconnect in ${delay/1000}s... (${reconnectAttempts.current}/${maxReconnectAttempts})`, 'warning');
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          addLog('❌ Max reconnection attempts reached', 'error');
        } else if (status === 'completed' || status === 'failed') {
          addLog('✅ Processing finished, no reconnection needed', 'info');
        }
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        addLog('❌ WebSocket connection error', 'error');
        clearTimeout(connectionTimeout);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      addLog('❌ Failed to establish connection', 'error');
    }
  }, [taskId, socket?.readyState, addLog, status, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socket) {
      socket.close(1000, 'User disconnected');
      setSocket(null);
    }
    
    setConnectionStatus('Disconnected');
    reconnectAttempts.current = 0; // Reset reconnect attempts
    addLog('Disconnected from server', 'info');
  }, [socket, addLog]);

  const manualReconnect = useCallback(() => {
    addLog('🔄 Manual reconnection requested...', 'info');
    disconnect();
    reconnectAttempts.current = 0; // Reset attempts for manual reconnect
    setTimeout(() => {
      connectWebSocket();
    }, 1000);
  }, [disconnect, connectWebSocket]);

  const sendMessage = useCallback((message) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      addLog('Cannot send message: Not connected', 'warning');
    }
  }, [socket, addLog]);

  // Connect when taskId changes
  useEffect(() => {
    if (taskId) {
      addLog(`Initializing connection for task: ${taskId}`, 'info');
      connectWebSocket();
    } else {
      setConnectionStatus('Waiting for task');
      setCurrentStep('Upload a file to start processing');
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [taskId, connectWebSocket, socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket,
    connectionStatus,
    lastMessage,
    progress,
    status,
    currentStep,
    error,
    logs,
    isConnected: connectionStatus === 'Connected',
    connect: connectWebSocket,
    disconnect,
    sendMessage,
    manualReconnect,
    reconnectAttempts: reconnectAttempts.current,
    maxReconnectAttempts
  };
};

export default useWebSocket;

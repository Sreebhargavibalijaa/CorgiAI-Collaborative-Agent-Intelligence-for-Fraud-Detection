import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ChartBarIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/stats');
      setStats(response.data);
      
      // Process analytics data (in a real app, you'd have dedicated analytics endpoints)
      processAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (data) => {
    // This would normally come from your backend analytics endpoints
    // For demo purposes, we'll generate some sample data based on the stats
    const recentActivity = data.recent_activity || [];
    
    // Generate agent performance data
    const agentPerformance = Object.keys(data.agent_versions || {}).map(agent => ({
      name: agent.charAt(0).toUpperCase() + agent.slice(1),
      accuracy: Math.random() * 20 + 80, // 80-100%
      totalAnalyzed: Math.floor(Math.random() * 1000) + 100,
      avgProcessingTime: Math.random() * 2 + 1 // 1-3 seconds
    }));

    // Generate fraud detection trends
    const fraudTrends = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      fraudulent: Math.floor(Math.random() * 10) + 5,
      legitimate: Math.floor(Math.random() * 30) + 20
    }));

    // Generate risk distribution
    const riskDistribution = [
      { name: 'Low Risk', value: 60, color: '#22c55e' },
      { name: 'Medium Risk', value: 30, color: '#f59e0b' },
      { name: 'High Risk', value: 10, color: '#ef4444' }
    ];

    setStats(prev => ({
      ...prev,
      agentPerformance,
      fraudTrends,
      riskDistribution
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500">
            Comprehensive insights into fraud detection performance and trends
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow-lg rounded-lg card-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Detection Accuracy</dt>
                    <dd className="text-lg font-medium text-gray-900">94.2%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-lg card-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-6 w-6 text-success-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Claims Processed</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.total_processed || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-lg card-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-danger-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Fraud Detected</dt>
                    <dd className="text-lg font-medium text-gray-900">8.3%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-lg card-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-warning-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Processing Time</dt>
                    <dd className="text-lg font-medium text-gray-900">2.4s</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Agent Performance */}
          <div className="bg-white shadow-lg rounded-lg card-shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Agent Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.agentPerformance || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#3b82f6" name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Distribution */}
          <div className="bg-white shadow-lg rounded-lg card-shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.riskDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(stats?.riskDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fraud Detection Trends */}
        <div className="bg-white shadow-lg rounded-lg card-shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fraud Detection Trends (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.fraudTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="fraudulent" stroke="#ef4444" name="Fraudulent Claims" />
              <Line type="monotone" dataKey="legitimate" stroke="#22c55e" name="Legitimate Claims" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Agent Details Table */}
        <div className="bg-white shadow-lg rounded-lg card-shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Agent Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Analyzed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Processing Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats?.agentPerformance?.map((agent, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {agent.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stats.agent_versions?.[agent.name.toLowerCase()] || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agent.accuracy.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agent.totalAnalyzed.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agent.avgProcessingTime.toFixed(2)}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Information */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white shadow-lg rounded-lg card-shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">System Status</dt>
                <dd className="text-sm font-medium text-gray-900">{stats?.system_status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Total Agents</dt>
                <dd className="text-sm font-medium text-gray-900">{Object.keys(stats?.agent_versions || {}).length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Last Updated</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {stats?.last_updated ? new Date(stats.last_updated).toLocaleString() : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white shadow-lg rounded-lg card-shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                Export Analytics Report
              </button>
              <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                Schedule Performance Review
              </button>
              <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                Configure Alert Thresholds
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

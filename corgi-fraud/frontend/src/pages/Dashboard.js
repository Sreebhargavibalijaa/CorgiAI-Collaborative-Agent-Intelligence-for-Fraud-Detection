import React, { useState, useEffect } from 'react';
import { ChartBarIcon, ClockIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <div className="bg-white overflow-hidden shadow-lg rounded-lg card-shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
                {description && (
                  <div className="text-sm text-gray-500">{description}</div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Fraud Detection Dashboard
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Advanced multi-agent AI system for insurance fraud detection
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Claims Processed"
          value={stats?.total_processed || 0}
          icon={ChartBarIcon}
          color="text-primary-600"
          description="All time"
        />
        <StatCard
          title="System Status"
          value={stats?.system_status || 'Unknown'}
          icon={ShieldCheckIcon}
          color="text-success-600"
          description="Real-time"
        />
        <StatCard
          title="Active Agents"
          value={Object.keys(stats?.agent_versions || {}).length}
          icon={ExclamationTriangleIcon}
          color="text-warning-600"
          description="AI agents running"
        />
        <StatCard
          title="Last Updated"
          value={stats?.last_updated ? new Date(stats.last_updated).toLocaleTimeString() : 'N/A'}
          icon={ClockIcon}
          color="text-gray-600"
          description="System time"
        />
      </div>

      {/* Agent Versions */}
      <div className="bg-white shadow-lg rounded-lg card-shadow mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Agent Versions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats?.agent_versions && Object.entries(stats.agent_versions).map(([agent, version]) => (
              <div key={agent} className="bg-gray-50 rounded-md p-3">
                <div className="text-sm font-medium text-gray-900 capitalize">{agent} Agent</div>
                <div className="text-sm text-gray-500">Version {version}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow-lg rounded-lg card-shadow">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          {stats?.recent_activity && stats.recent_activity.length > 0 ? (
            <div className="flow-root">
              <ul className="-mb-8">
                {stats.recent_activity.map((activity, idx) => (
                  <li key={idx}>
                    <div className="relative pb-8">
                      {idx !== stats.recent_activity.length - 1 && (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                            <ShieldCheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Agent <span className="font-medium text-gray-900">{activity.agent}</span> analyzed claim{' '}
                              <span className="font-medium text-gray-900">{activity.claim_id?.slice(0, 8)}...</span>
                            </p>
                            <p className="text-sm text-gray-500">Score: {activity.score}</p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500">No recent activity available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

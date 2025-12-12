'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';
import Loading from '../../components/Loading';

interface Document {
  id: number;
  title: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT';
}

interface AuditLog {
  id: number;
  user: { username: string };
  action: string;
  timestamp: string;
  details: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const EmployeeDashboardPage = () => {
    const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const docsResponse = await api.get<Document[]>('/documents/');

                const documents = docsResponse.data;
                const counts = documents.reduce(
                    (acc, doc) => {
                        const status = doc.status?.toLowerCase();
                        if (status === 'pending') acc.pending += 1;
                        else if (status === 'approved') acc.approved += 1;
                        else if (status === 'rejected') acc.rejected += 1;
                        acc.total += 1;
                        return acc;
                    },
                    { total: 0, pending: 0, approved: 0, rejected: 0 } as Stats
                );

                setStats(counts);

                // Audit log is admin-only; best effort
                try {
                    const logsResponse = await api.get<AuditLog[]>('/audit/?limit=5');
                    setRecentActivity(logsResponse.data);
                } catch (auditErr) {
                    // Non-admins will 403; ignore silently for dashboard stats
                    setRecentActivity([]);
                }

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatTimestamp = (timestamp: string) => new Date(timestamp).toLocaleString();

    if (loading) {
        return <Loading />;
    }

    return (
        <ProtectedRoute roles={["USER"]}>
            <div className="container mx-auto p-4 md:p-6">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Employee Dashboard</h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                        <h2 className="text-lg font-semibold text-gray-600">Your Documents</h2>
                        <p className="text-4xl font-bold text-gray-800">{stats.total}</p>
                    </div>
                     <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                        <h2 className="text-lg font-semibold text-gray-600">Pending Review</h2>
                        <p className="text-4xl font-bold text-gray-800">{stats.pending}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                        <h2 className="text-lg font-semibold text-gray-600">Approved</h2>
                        <p className="text-4xl font-bold text-gray-800">{stats.approved}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                        <h2 className="text-lg font-semibold text-gray-600">Rejected</h2>
                        <p className="text-4xl font-bold text-gray-800">{stats.rejected}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Quick Actions</h2>
                        <div className="flex flex-col space-y-3">
                            <Link href="/documents/upload" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded text-center transition duration-300">
                                Upload New Document
                            </Link>
                            <Link href="/documents" className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded text-center transition duration-300">
                                View All Documents
                            </Link>
                             <Link href="/audit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded text-center transition duration-300">
                                View Full Audit Log
                            </Link>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Recent Activity on Your Documents</h2>
                        {recentActivity.length > 0 ? (
                             <ul className="space-y-4">
                                {recentActivity.map((item) => (
                                    <li key={item.id} className="border-b pb-3 last:border-b-0">
                                        <p className="font-medium text-gray-800">{item.details}</p>
                                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                                            <span>by <strong>{item.user.username}</strong></span>
                                            <span>{formatTimestamp(item.timestamp)}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">No recent activity to display.</p>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default EmployeeDashboardPage;
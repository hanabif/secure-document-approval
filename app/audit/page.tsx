'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import ProtectedRoute from '../../components/ProtectedRoute';
import Loading from '../../components/Loading';

interface Log {
    id: number;
    user: { username: string };
    action: string;
    timestamp: string;
    details: string;
}

interface Filters {
    user_id: string;
    action: string;
    document_id: string;
    start_date: string;
    end_date: string;
}

const AuditPage = () => {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<Filters>({
        user_id: '',
        action: '',
        document_id: '',
        start_date: '',
        end_date: '',
    });

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    params.append(key, value);
                }
            });

            const response = await api.get(`/audit/logs/?${params.toString()}`);
            setLogs(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
            setError('Failed to load audit logs.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchLogs();
    };
    
     const resetFilters = () => {
        setFilters({
            user_id: '',
            action: '',
            document_id: '',
            start_date: '',
            end_date: '',
        });
    };

    return (
        <ProtectedRoute >
            <div className="container mx-auto p-4 md:p-6">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Audit Log</h1>
                
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                    <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1">User ID</label>
                            <input type="text" name="user_id" value={filters.user_id} onChange={handleFilterChange} className="p-2 border rounded" />
                        </div>
                        <div className="flex flex-col">
                           <label className="text-sm font-medium mb-1">Document ID</label>
                           <input type="text" name="document_id" value={filters.document_id} onChange={handleFilterChange} className="p-2 border rounded" />
                        </div>
                        <div className="flex flex-col">
                             <label className="text-sm font-medium mb-1">Action</label>
                            <input type="text" name="action" value={filters.action} onChange={handleFilterChange} className="p-2 border rounded" />
                        </div>
                        <div className="flex flex-col">
                           <label className="text-sm font-medium mb-1">Start Date</label>
                           <input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} className="p-2 border rounded" />
                        </div>
                        <div className="flex flex-col">
                           <label className="text-sm font-medium mb-1">End Date</label>
                           <input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} className="p-2 border rounded" />
                        </div>
                        <div className="flex gap-2">
                             <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Filter</button>
                             <button type="button" onClick={resetFilters} className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600">Reset</button>
                        </div>
                    </form>
                </div>

                {loading ? <Loading /> : error ? <p className="text-center text-red-500">{error}</p> : (
                    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {logs.length > 0 ? logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.user.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.action}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{log.details}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 text-gray-500">No logs found for the selected filters.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
    
};

export default AuditPage;
'use client';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';
import Loading from '../../components/Loading';

interface User {
    id: number;
    username: string;
    email: string;
    role: number;
}

interface AuditLog {
    id: number;
    user: { username: string };
    action: string;
    timestamp: string;
    details: string;
}

const ROLE_MAP: { [key: number]: string } = {
    0: 'Employee',
    1: 'Manager',
    2: 'Senior Manager',
    3: 'Director',
    99: 'Admin',
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState<User[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editedRoles, setEditedRoles] = useState<Record<number, number>>({});
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [usersResponse, auditLogsResponse] = await Promise.all([
                    api.get('/accounts/users/'),
                    api.get('/audit/'),
                ]);
                setUsers(usersResponse.data);
                setAuditLogs(auditLogsResponse.data);
            } catch (err) {
                console.error('Failed to fetch admin data:', err);
                setError('Failed to load data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleRoleChange = (userId: number, newRole: number) => {
        setEditedRoles(prev => ({ ...prev, [userId]: newRole }));
        setSaveMessage(null);
    };

    const handleDiscardChanges = () => {
        setEditedRoles({});
        setSaveMessage(null);
    };

    const handleSaveChanges = async () => {
        if (Object.keys(editedRoles).length === 0) return;
        setSaving(true);
        setError(null);
        const failures: Array<{ userId: number; err: any }> = [];
        try {
            // Send requests sequentially to avoid overwhelming server and make error reporting simpler
            for (const [idStr, role] of Object.entries(editedRoles)) {
                const userId = parseInt(idStr, 10);
                try {
                    await api.post(`/accounts/users/${userId}/role/`, { role });
                } catch (err) {
                    failures.push({ userId, err });
                }
            }

            // Refresh users list regardless
            const usersResponse = await api.get('/accounts/users/');
            setUsers(usersResponse.data);

            if (failures.length === 0) {
                setSaveMessage('All changes saved successfully.');
                setEditedRoles({});
            } else {
                setSaveMessage(`${failures.length} change(s) failed. Please retry.`);
                // leave editedRoles so user can retry
            }
        } catch (err) {
            console.error('Failed to save changes:', err);
            setError('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loading />;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <ProtectedRoute roles={["ADMIN"]}>
            <Navbar />
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
                <div className="flex border-b mb-6">
                    <button
                        className={`py-2 px-4 ${activeTab === 'users' ? 'border-b-2 border-blue-500' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        User Management
                    </button>
                    <button
                        className={`py-2 px-4 ${activeTab === 'audit' ? 'border-b-2 border-blue-500' : ''}`}
                        onClick={() => setActiveTab('audit')}
                    >
                        Audit Log
                    </button>
                </div>

                {activeTab === 'users' && (
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <div className="p-4 border-b flex items-center justify-between">
                            <div>
                                <button
                                    onClick={handleSaveChanges}
                                    disabled={Object.keys(editedRoles).length === 0 || saving}
                                    className={`mr-2 bg-blue-600 text-white px-3 py-2 rounded ${Object.keys(editedRoles).length === 0 || saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={handleDiscardChanges}
                                    disabled={Object.keys(editedRoles).length === 0 || saving}
                                    className={`bg-gray-300 text-gray-800 px-3 py-2 rounded ${Object.keys(editedRoles).length === 0 || saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-400'}`}
                                >
                                    Discard Changes
                                </button>
                            </div>
                            <div className="text-sm text-gray-600">
                                {Object.keys(editedRoles).length > 0 ? `${Object.keys(editedRoles).length} unsaved change(s)` : 'No unsaved changes'}
                            </div>
                        </div>
                        {saveMessage && <div className="p-3 text-center text-sm text-green-700">{saveMessage}</div>}
                        <table className="min-w-full leading-normal">
                            <thead className="bg-gray-800 text-white">
                                <tr>
                                    <th className="px-5 py-3 text-left">Username</th>
                                    <th className="px-5 py-3 text-left">Email</th>
                                    <th className="px-5 py-3 text-left">Role</th>
                                    <th className="px-5 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-100">
                                        <td className="px-5 py-4">{user.username}</td>
                                        <td className="px-5 py-4">{user.email}</td>
                                        <td className="px-5 py-4">{ROLE_MAP[user.role] || 'Unknown'}</td>
                                        <td className="px-5 py-4">
                                            {user.role !== 99 && (
                                                <select
                                                    value={editedRoles[user.id] ?? user.role}
                                                    onChange={(e) => handleRoleChange(user.id, parseInt(e.target.value))}
                                                    className="p-2 border rounded"
                                                >
                                                    <option value={0}>Employee</option>
                                                    <option value={1}>Manager</option>
                                                    <option value={2}>Senior Manager</option>
                                                    <option value={3}>Director</option>
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'audit' && (
                     <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full leading-normal">
                             <thead className="bg-gray-800 text-white">
                                <tr>
                                    <th className="px-5 py-3 text-left">Timestamp</th>
                                    <th className="px-5 py-3 text-left">User</th>
                                    <th className="px-5 py-3 text-left">Action</th>
                                    <th className="px-5 py-3 text-left">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-100">
                                        <td className="px-5 py-4">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="px-5 py-4">{log.user.username}</td>
                                        <td className="px-5 py-4">{log.action}</td>
                                        <td className="px-5 py-4">{log.details}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
};

export default AdminDashboard;
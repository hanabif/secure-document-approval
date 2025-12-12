'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Loading from '../../../components/Loading';

interface Document {
    id: number;
    title: string;
    can_manage_permissions: boolean;
    permissions: Permission[];
}

interface Permission {
    user: { id: number, username: string };
    permission_level: 'VIEW' | 'APPROVE';
}

interface User {
    id: number;
    username: string;
}

const PermissionsPage = () => {
    const { id } = useParams();
    const router = useRouter();
    const [document, setDocument] = useState<Document | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [selectedPermission, setSelectedPermission] = useState<'VIEW' | 'APPROVE'>('VIEW');

    const fetchPermissions = useCallback(async () => {
        if (id) {
            try {
                const docResponse = await api.get(`/documents/${id}/`);
                if (!docResponse.data.can_manage_permissions) {
                    setError("You don't have permission to manage this document.");
                    setDocument(null);
                    return;
                }
                setDocument(docResponse.data);

                const usersResponse = await api.get('/auth/users/');
                setAllUsers(usersResponse.data);

            } catch (err) {
                console.error('Failed to fetch data:', err);
                setError('Failed to load permission data.');
            } finally {
                setLoading(false);
            }
        }
    }, [id]);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);
    
    const handleAddPermission = () => {
        if (!selectedUser || !document) return;
        const userId = parseInt(selectedUser, 10);
        // Avoid adding duplicate user permissions
        if (document.permissions.some(p => p.user.id === userId)) {
            setError('This user already has permissions assigned.');
            return;
        }
        
        const userToAdd = allUsers.find(u => u.id === userId);
        if(userToAdd) {
            const newPermission: Permission = { user: userToAdd, permission_level: selectedPermission };
            setDocument({
                ...document,
                permissions: [...document.permissions, newPermission]
            });
            setError(null);
        }
    };

    const handleRemovePermission = (userIdToRemove: number) => {
        if (!document) return;
        setDocument({
            ...document,
            permissions: document.permissions.filter(p => p.user.id !== userIdToRemove),
        });
    };

    const handleSaveChanges = async () => {
        if (!document) return;
        setIsSaving(true);
        setError(null);
        
        const payload = {
            permissions: document.permissions.map(p => ({
                user_id: p.user.id,
                permission_level: p.permission_level
            }))
        };
        
        try {
            await api.post(`/documents/${id}/permissions/`, payload);
            router.push(`/documents/${id}`);
        } catch(err: any) {
            console.error("Failed to save permissions:", err);
            setError(err.response?.data?.detail || "An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <div className="container mx-auto p-4 md:p-6 max-w-3xl">
                {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</p>}
                {document ? (
                    <div className="bg-white shadow-lg rounded-lg p-8">
                        <h1 className="text-2xl font-bold mb-2 text-gray-800">Manage Permissions</h1>
                        <h2 className="text-xl font-semibold text-gray-600 mb-6">{document.title}</h2>
                        
                        <div className="bg-gray-50 p-4 rounded-md mb-6">
                            <h3 className="font-bold text-lg mb-3">Add New Permission</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="w-full p-2 border rounded">
                                    <option value="" disabled>Select a user...</option>
                                    {allUsers.map(user => (
                                        <option key={user.id} value={user.id}>{user.username}</option>
                                    ))}
                                </select>
                                <select value={selectedPermission} onChange={e => setSelectedPermission(e.target.value as 'VIEW' | 'APPROVE')} className="w-full p-2 border rounded">
                                    <option value="VIEW">Can View</option>
                                    <option value="APPROVE">Can Approve</option>
                                </select>
                                <button onClick={handleAddPermission} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition">Add</button>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg mb-3">Current Permissions</h3>
                            <ul className="space-y-2">
                               {document.permissions.map(p => (
                                   <li key={p.user.id} className="flex justify-between items-center bg-white p-3 border rounded-md">
                                       <div>
                                           <span className="font-semibold">{p.user.username}</span>
                                           <span className={`ml-3 text-sm font-medium px-2 py-1 rounded-full ${p.permission_level === 'APPROVE' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {p.permission_level}
                                           </span>
                                       </div>
                                       <button onClick={() => handleRemovePermission(p.user.id)} className="text-red-500 hover:text-red-700 font-semibold">Remove</button>
                                   </li>
                               ))}
                               {document.permissions.length === 0 && <p className="text-gray-500">No specific permissions assigned.</p>}
                            </ul>
                        </div>
                        
                        <div className="mt-8 flex justify-end gap-4">
                            <button onClick={() => router.back()} className="text-gray-600 font-bold py-2 px-4 rounded">Cancel</button>
                            <button onClick={handleSaveChanges} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded transition disabled:bg-green-300">
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        <p>Document not loaded or insufficient permissions.</p>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
};

export default PermissionsPage;
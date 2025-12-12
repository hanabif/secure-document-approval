'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import api from '../../../../lib/api';
import Loading from '../../../../components/Loading';

interface User {
    id: number;
    username: string;
}

interface Document {
    id: number;
    title: string;
    content: string;
    classification: string;
    status: string;
    owner: User;
    created_at: string;
    file: string; // URL to the document file
}

interface AuditLog {
    id: number;
    user: { username: string };
    action: string;
    timestamp: string;
    details: string;
}

interface Comment {
    id: number;
    user: User;
    content: string;
    created_at: string;
}

const ApprovalWorkspacePage = () => {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [document, setDocument] = useState<Document | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionStatus, setActionStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                setCurrentUser(JSON.parse(userStr));
            }
        }

        if (id) {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    const [docResponse, auditResponse, commentsResponse] = await Promise.all([
                        api.get(`/documents/${id}/`),
                        api.get(`/audit/?document_id=${id}`),
                        api.get(`/documents/${id}/comments/`)
                    ]);
                    setDocument(docResponse.data);
                    setAuditLogs(auditResponse.data);
                    setComments(commentsResponse.data);
                } catch (err) {
                    console.error("Failed to fetch data:", err);
                    setError("Failed to load document details. It might have been deleted or you may not have permission.");
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [id]);

    const handleAction = async (action: 'approve' | 'reject' | 'request_changes') => {
        setActionStatus(null);
        try {
            if (action === 'request_changes') {
                // Not supported by backend yet
                alert("Request changes not supported yet.");
                return;
            }
            
            const approved = action === 'approve';
            await api.post(`/documents/${id}/approve/`, { approved });

            setActionStatus({ message: `Document successfully ${action.replace('_', ' ')}d.`, type: 'success' });
            setTimeout(() => router.push('/manager/approvals'), 2000);
        } catch (err) {
            console.error(`Failed to ${action} document:`, err);
            setActionStatus({ message: `Action failed. Please try again.`, type: 'error' });
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        
        try {
            const response = await api.post<Comment>(`/documents/${id}/comments/`, { content: newComment });
            setComments([...comments, response.data]);
            setNewComment('');
        } catch (err) {
            console.error("Failed to add comment:", err);
            setActionStatus({ message: "Failed to post comment.", type: 'error' });
        }
    };
    
    if (loading) return <Loading />;
    if (error) return <div className="container mx-auto p-6 text-red-500 text-center">{error}</div>;
    if (!document) return null;

    const isOwner = currentUser?.id === document.owner.id;
    const formatTimestamp = (ts: string) => new Date(ts).toLocaleString();

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 md:p-6">
                {actionStatus && (
                    <div className={`p-4 mb-4 rounded-md text-white ${actionStatus.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {actionStatus.message}
                    </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content: Document Details & Actions */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                        <div className="border-b pb-4 mb-4">
                            <h1 className="text-3xl font-bold text-gray-800">{document.title}</h1>
                            <div className="flex items-center text-sm text-gray-500 mt-2">
                               <span>Owned by <strong>{document.owner.username}</strong></span>
                               <span className="mx-2">|</span>
                               <span>Submitted on {new Date(document.created_at).toLocaleDateString()}</span>
                           </div>
                        </div>

                        {/* Document Metadata */}
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold mb-3 text-gray-700">Document Details</h3>
                            <div className="space-y-2">
                                <p><strong>Status:</strong> <span className="font-semibold text-blue-600">{document.status}</span></p>
                                <p><strong>Classification:</strong> <span className="font-semibold text-purple-600">{document.classification}</span></p>
                                <a href={`http://127.0.0.1:8000${document.file}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                                    Download Document
                                </a>
                            </div>
                        </div>
                        
                        {/* Approval Actions */}
                        <div className="mb-6">
                             <h3 className="text-xl font-semibold mb-3 text-gray-700">Approval Actions</h3>
                             {isOwner ? (
                                <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
                                    You cannot perform approval actions on your own documents.
                                </div>
                             ) : (
                                <div className="flex space-x-3">
                                    <button onClick={() => handleAction('approve')} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Approve</button>
                                    <button onClick={() => handleAction('reject')} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Reject</button>
                                    <button onClick={() => handleAction('request_changes')} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Request Changes</button>
                                </div>
                             )}
                        </div>

                        {/* Comments Section */}
                        <div>
                             <h3 className="text-xl font-semibold mb-3 text-gray-700">Comments</h3>
                             <div className="space-y-4 max-h-60 overflow-y-auto mb-4 pr-2">
                                {comments.length > 0 ? comments.map(c => (
                                    <div key={c.id} className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-gray-800">{c.content}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            <strong>{c.user.username}</strong> on {formatTimestamp(c.created_at)}
                                        </p>
                                    </div>
                                )) : <p className="text-gray-500">No comments yet.</p>}
                             </div>
                             <form onSubmit={handleAddComment}>
                                <textarea 
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="w-full p-2 border rounded-md"
                                    rows={3}
                                ></textarea>
                                <button type="submit" className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">Post Comment</button>
                             </form>
                        </div>
                    </div>

                    {/* Sidebar: Audit History */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Audit History</h3>
                        {auditLogs.length > 0 ? (
                             <ul className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                {auditLogs.map((log) => (
                                    <li key={log.id} className="border-b pb-3 last:border-b-0">
                                        <p className="font-medium text-gray-800">{log.details}</p>
                                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                                            <span>by <strong>{log.user.username}</strong></span>
                                            <span className="text-right">{formatTimestamp(log.timestamp)}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">No audit history available for this document.</p>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default ApprovalWorkspacePage;

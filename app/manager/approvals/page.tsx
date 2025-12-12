'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';
import api from '../../../lib/api';
import Loading from '../../../components/Loading';

interface Document {
  id: number;
  title: string;
  owner: { username: string };
  classification: string;
  created_at: string;
  status: string;
}

const ApprovalsListPage = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPendingDocuments = async () => {
            try {
                setLoading(true);
                const response = await api.get<Document[]>('/documents/?pending_for_manager=true');
                setDocuments(response.data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch pending documents:", err);
                setError("Failed to load documents. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchPendingDocuments();
    }, []);

    if (loading) {
        return <Loading />;
    }

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 md:p-6">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Pending Approvals</h1>

                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-6">{error}</p>}

                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full leading-normal">
                        <thead className="bg-gray-800 text-white">
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold uppercase tracking-wider">
                                    Document Title
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold uppercase tracking-wider">
                                    Owner
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold uppercase tracking-wider">
                                    Classification
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold uppercase tracking-wider">
                                    Submitted
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.length > 0 ? (
                                documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-100">
                                        <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">{doc.title}</p>
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">{doc.owner.username}</p>
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                                            <span className="relative inline-block px-3 py-1 font-semibold text-purple-900 leading-tight">
                                                <span aria-hidden className="absolute inset-0 bg-purple-200 opacity-50 rounded-full"></span>
                                                <span className="relative">{doc.classification}</span>
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                                            <span className="relative inline-block px-3 py-1 font-semibold text-yellow-900 leading-tight">
                                                <span aria-hidden className="absolute inset-0 bg-yellow-200 opacity-50 rounded-full"></span>
                                                <span className="relative">{doc.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                                            <Link href={`/manager/approvals/${doc.id}`} className="text-indigo-600 hover:text-indigo-900 font-semibold">
                                                Review
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500">
                                        No documents are currently pending your approval.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default ApprovalsListPage;

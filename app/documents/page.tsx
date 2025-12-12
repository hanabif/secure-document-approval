'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import Loading from '../../components/Loading';
import Navbar from '../../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { SecurityLevel } from '@/lib/permissions';

interface Document {
    id: number;
    title: string;
    status: string;
    classification: SecurityLevel;
    created_at: string;
    owner?: string;
}

const DocumentsPage = () => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDocuments = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const response = await api.get('/documents/');
                const allDocuments = response.data as Document[];
                // Backend already scopes list to the current owner; show all returned
                setDocuments(allDocuments);
                setError(null);
            } catch (error) {
                console.error('Failed to fetch documents:', error);
                setError('Failed to load documents. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchDocuments();
    }, [user]);
    
    const getStatusChip = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{status}</span>;
            case 'PENDING':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">{status}</span>;
            case 'REJECTED':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">{status}</span>;
            case 'DRAFT':
            default:
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    if (loading) return <Loading />;

    return (
        <>
        <Navbar />
        <div className="container mx-auto p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Documents</h1>
                <Link href="/documents/upload" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                    Upload Document
                </Link>
            </div>

            {error && <p className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</p>}
            
            {!error && documents.length === 0 && !loading && (
                <div className="text-center bg-white p-10 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700">No documents found.</h2>
                    <p className="text-gray-500 mt-2">Get started by uploading your first document or check your permissions.</p>
                </div>
            )}

            {!error && documents.length > 0 && (
                <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classification</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {documents.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusChip(doc.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.classification}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/documents/${doc.id}`} className="text-indigo-600 hover:text-indigo-900">View Details</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        </>
    );
};

export default DocumentsPage;
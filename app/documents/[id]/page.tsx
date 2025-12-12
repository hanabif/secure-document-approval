'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';
import api from '../../../lib/api';
import Loading from '../../../components/Loading';

interface Document {
  id: number;
  title: string;
  description: string;
  classification: string;
  status: string;
  file: string;
  can_approve: boolean;
}

const DocumentReviewPage = () => {
    const { id } = useParams();
    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [comments, setComments] = useState('');

    useEffect(() => {
        const fetchDocument = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const docResponse = await api.get(`/documents/${id}/`);
                setDocument(docResponse.data);
            } catch (err) {
                console.error("Failed to fetch document:", err);
                setError("Failed to load data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();
    }, [id]);

    const handleApprovalAction = async (approved: boolean) => {
        try {
            await api.post(`/documents/${id}/approve/`, {
                approved,
                comments,
            });
            // Refresh document data
            const response = await api.get(`/documents/${id}/`);
            setDocument(response.data);
        } catch (err) {
            console.error('Failed to submit approval action:', err);
            setError('Failed to submit approval. You may not have the required permissions.');
        }
    };

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    if (!document) {
        return <p>Document not found.</p>;
    }

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-4">{document.title}</h1>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center space-x-4">
                        <p><strong>Status:</strong> {document.status}</p>
                        <Link href={`/audit/${document.id}`} className="text-sm text-blue-500 hover:underline">
                            (View Audit Trail)
                        </Link>
                    </div>
                    <p><strong>Classification:</strong> {document.classification}</p>
                    <p><strong>Description:</strong> {document.description}</p>
                    {document.file && (
                        <a href={document.file} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            View Document File
                        </a>
                    )}

                    {document.can_approve && document.status === 'pending' && (
                        <div className="mt-6">
                            <h3 className="text-xl font-semibold mb-2">Approval Action</h3>
                            <textarea
                                className="w-full p-2 border rounded"
                                rows={4}
                                placeholder="Add comments..."
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                            />
                            <div className="flex space-x-4 mt-4">
                                <button
                                    onClick={() => handleApprovalAction(true)}
                                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleApprovalAction(false)}
                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
};


export default DocumentReviewPage;

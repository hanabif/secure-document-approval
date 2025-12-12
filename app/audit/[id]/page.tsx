'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../lib/api';
import Loading from '../../../components/Loading';
import ProtectedRoute from '../../../components/ProtectedRoute';

interface Approval {
  id: number;
  approver: string;
  approved: boolean;
  comments: string;
  timestamp: string;
}

const AuditTrailPage = () => {
  const params = useParams();
  const { id } = params;

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>('');

  useEffect(() => {
    if (!id) return;

    const fetchAuditTrail = async () => {
      try {
        setLoading(true);
        const [docResponse, auditResponse] = await Promise.all([
          api.get(`/documents/${id}/`),
          api.get(`/documents/${id}/audit/`)
        ]);
        setDocumentTitle(docResponse.data.title);
        setApprovals(auditResponse.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch audit trail:", err);
        setError("Failed to load audit trail. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAuditTrail();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Audit Trail</h1>
        <h2 className="text-xl font-semibold mb-6 text-gray-600">for {documentTitle}</h2>

        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-6">{error}</p>}

        <div className="space-y-4">
          {approvals.length > 0 ? (
            approvals.map((approval) => (
              <div key={approval.id} className="bg-white p-4 rounded-lg shadow-md border-l-4 
                ${approval.approved ? 'border-green-500' : 'border-red-500'}">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-lg">
                    {approval.approver}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(approval.timestamp).toLocaleString()}
                  </p>
                </div>
                <p className={`mt-2 font-bold ${approval.approved ? 'text-green-600' : 'text-red-600'}`}>
                  {approval.approved ? 'Approved' : 'Rejected'}
                </p>
                {approval.comments && (
                  <p className="mt-2 text-gray-700 bg-gray-50 p-2 rounded">
                    <span className="font-semibold">Comments:</span> {approval.comments}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-10">No approval history found for this document.</p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AuditTrailPage;

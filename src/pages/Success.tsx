import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verifySession } from '../services/bookingService';

export default function Success() {
  const { sessionId } = useParams();
  const [status, setStatus] = useState("loading");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("missing_id");
      return;
    }
    verifySession(sessionId)
      .then(res => {
        if (res.verified) {
            setStatus("verified");
            setData(res);
        } else {
            setStatus("failed");
        }
      })
      .catch(() => setStatus("error"));
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-white p-10 font-sans">
      <div className="max-w-2xl mx-auto bg-green-50 border border-green-200 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-green-800 mb-4">SUCCESS ROUTE MATCHED</h1>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded border border-gray-200">
            <p className="text-sm text-gray-500 uppercase font-bold">Session ID</p>
            <p className="font-mono text-lg break-all">{sessionId}</p>
          </div>

          <div className="bg-white p-4 rounded border border-gray-200">
            <p className="text-sm text-gray-500 uppercase font-bold">Verification Status</p>
            <p className={`font-bold text-lg uppercase ${status === 'verified' ? 'text-green-600' : 'text-red-600'}`}>
              {status}
            </p>
          </div>

          {data && (
            <div className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto text-xs font-mono">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        </div>

        <Link to="/" className="mt-8 inline-block bg-green-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-800 transition-colors">
          Return Home
        </Link>
      </div>
    </div>
  );
}
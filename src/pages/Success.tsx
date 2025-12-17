import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verifySession } from '../services/bookingService';

export default function Success() {
  const { sessionId } = useParams();
  const [status, setStatus] = useState("loading"); // loading, verified, failed, error
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("missing_id");
      return;
    }

    // Call API to verify
    verifySession(sessionId)
      .then(res => {
        console.log("Verification result:", res);
        if (res.verified) {
            setStatus("verified");
            setData(res);
        } else {
            setStatus("failed");
        }
      })
      .catch((err) => {
        console.error("Verification error:", err);
        setStatus("error");
      });
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-white p-6 md:p-12 font-sans flex flex-col items-center">
      <div className="max-w-3xl w-full bg-green-50 border border-green-200 rounded-xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-green-800 mb-6 border-b border-green-200 pb-4">
          SUCCESS ROUTE MATCHED
        </h1>
        
        <div className="grid gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Session ID</p>
            <p className="font-mono text-sm md:text-base break-all text-gray-800 bg-gray-50 p-2 rounded">
              {sessionId || "None provided"}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Status</p>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                status === 'verified' ? 'bg-green-500' : 
                status === 'loading' ? 'bg-blue-500 animate-pulse' : 
                'bg-red-500'
              }`}></div>
              <p className={`font-bold text-lg uppercase ${
                status === 'verified' ? 'text-green-700' : 
                status === 'loading' ? 'text-blue-700' : 
                'text-red-700'
              }`}>
                {status}
              </p>
            </div>
            {status === 'loading' && <p className="text-sm text-gray-500 mt-1">Verifying payment with server...</p>}
            {status === 'error' && <p className="text-sm text-red-500 mt-1">Could not connect to verification server. (This is expected in preview without a backend)</p>}
          </div>

          {data && (
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto shadow-inner max-h-96">
              <p className="text-xs text-gray-400 font-bold uppercase mb-2">Server Response</p>
              <pre className="text-xs font-mono">{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-green-200">
          <Link 
            to="/" 
            className="inline-flex items-center justify-center bg-green-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-800 transition-colors shadow-md hover:shadow-lg"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
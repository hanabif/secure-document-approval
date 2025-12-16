"use client";
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/navigation';

export default function MfaSetupPage() {
  const [step, setStep] = useState<'loading' | 'qr' | 'success'>('loading');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Generate secret
    api.post('/accounts/auth/mfa/setup/')
      .then(res => {
        setQrCode(res.data.qr_code);
        setSecret(res.data.secret);
        setStep('qr');
      })
      .catch(err => {
        setError('Failed to start MFA setup.');
        setStep('qr'); // stay on page but show error
      });
  }, []);

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/accounts/auth/mfa/verify/', { code: otp });
      setStep('success');
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (err: any) {
      setError('Invalid code. Please try again.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-md mx-auto p-6 mt-10 border rounded shadow bg-white">
        <h1 className="text-2xl font-bold mb-4">Setup Multi-Factor Authentication</h1>
        
        {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>}

        {step === 'loading' && <div>Generating secure key...</div>}

        {step === 'qr' && (
          <div>
            <p className="mb-4 text-gray-700">Scan this QR code with your authenticator app (e.g. Google Authenticator).</p>
            <div className="flex justify-center mb-6">
              {qrCode && <img src={qrCode} alt="MFA QR Code" className="border p-2" />}
            </div>
            <p className="text-sm text-gray-500 mb-4 text-center">Secret: {secret}</p>
            
            <form onSubmit={onVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Enter 6-digit Code</label>
                <input 
                  type="text" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  className="mt-1 block w-full border rounded p-2 text-center text-xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Verify & Enable
              </button>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center text-green-600">
            <h2 className="text-xl font-bold">Success!</h2>
            <p>MFA is now enabled on your account.</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting to profile...</p>
          </div>
        )}
      </div>
    </>
  );
}

'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

const ForgotPasswordPage = () => {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const policy = useMemo(() => {
    const lengthOK = newPassword.length >= 10;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /\d/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    return { lengthOK, hasUpper, hasLower, hasDigit, hasSpecial };
  }, [newPassword]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (!oldPassword || !newPassword) {
      setError('Please fill all fields.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/accounts/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setSuccess(res.data?.detail || 'Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Log out locally and redirect back to login after short delay
      try { logout(); } catch {}
      setTimeout(() => router.push('/login'), 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to change password.';
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen bg-gray-100 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8">
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Forgot Password</h1>

            {!isAuthenticated ? (
              <div className="text-center">
                <p className="text-gray-700 mb-4">
                  To reset your password, please log in first, then use this page to change your password securely.
                </p>
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Go to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleChangePassword}>
                {error && (
                  <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
                    {success}
                  </p>
                )}

                <div className="mb-4">
                  <label htmlFor="old_password" className="block text-gray-700 text-sm font-bold mb-2">
                    Current Password
                  </label>
                  <input
                    id="old_password"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="new_password" className="block text-gray-700 text-sm font-bold mb-2">
                    New Password
                  </label>
                  <input
                    id="new_password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                  <div className="mt-2 text-xs space-y-1">
                    <p className={policy.lengthOK ? 'text-green-600' : 'text-gray-500'}>
                      • At least 10 characters
                    </p>
                    <p className={policy.hasUpper ? 'text-green-600' : 'text-gray-500'}>
                      • Contains an uppercase letter (A-Z)
                    </p>
                    <p className={policy.hasLower ? 'text-green-600' : 'text-gray-500'}>
                      • Contains a lowercase letter (a-z)
                    </p>
                    <p className={policy.hasDigit ? 'text-green-600' : 'text-gray-500'}>
                      • Contains a number (0-9)
                    </p>
                    <p className={policy.hasSpecial ? 'text-green-600' : 'text-gray-500'}>
                      • Contains a special character (!@#$…)
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="confirm_password" className="block text-gray-700 text-sm font-bold mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm_password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !policy.lengthOK || !policy.hasUpper || !policy.hasLower || !policy.hasDigit || !policy.hasSpecial || newPassword !== confirmPassword}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {submitting ? 'Changing…' : 'Change Password'}
                </button>
                <p className="text-center text-xs text-gray-500 mt-3">
                  Tip: Use a passphrase you can remember but others can’t guess.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;

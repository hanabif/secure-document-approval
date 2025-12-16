'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import ReCAPTCHA from 'react-google-recaptcha';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [mfaRequired, setMfaRequired] = useState(false);
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const [error, setError] = useState('');
    const router = useRouter();
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!mfaRequired && !recaptchaToken) {
            setError('Please complete the reCAPTCHA.');
            return;
        }

        try {
            // Only verify recaptcha on first step
            if (!mfaRequired) {
                const captchaVerification = await api.post('/accounts/verify-recaptcha/', {
                    token: recaptchaToken,
                });
                if (!captchaVerification.data.success) {
                    setError('reCAPTCHA verification failed.');
                    return;
                }
            }

            const payload: any = { username, password };
            if (mfaRequired) {
                payload.otp_code = otp;
            }

            const response = await api.post('/accounts/auth/login/', payload);

            if (response.data.mfa_required) {
                setMfaRequired(true);
                return;
            }

            // Normal login success
            const token = response.data.token || response.data.access;
            if (token) {
                login(token);
                router.push('/dashboard');
            } else {
                setError('Login failed: No token received.');
            }

        } catch (err: any) {
            console.error('Login error:', err);
            if (err.response) {
                const data = err.response.data;
                const errorDetail =
                    data.error ||
                    data.detail ||
                    (data.non_field_errors ? data.non_field_errors.join(' ') : 'Invalid credentials');
                setError(errorDetail);
            } else {
                setError('Network error. Please check your connection.');
            }
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form onSubmit={handleLogin}>
                    {!mfaRequired ? (
                        <>
                            <div className="mb-4">
                                <label className="block text-gray-700">Username</label>
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700">Password</label>
                                <input
                                    type="password"
                                    className="w-full border rounded px-3 py-2"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-4 flex justify-center">
                                <ReCAPTCHA
                                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string}
                                    onChange={(token) => setRecaptchaToken(token)}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="mb-6">
                            <label className="block text-gray-700">MFA Code</label>
                            <input
                                type="text"
                                className="w-full border rounded px-3 py-2 text-center tracking-widest"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="000000"
                                required
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-2">Enter the 6-digit code from your authenticator app.</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
                        >
                            {mfaRequired ? 'Verify' : 'Sign In'}
                        </button>
                    </div>

                    <p className="mt-3 text-center text-sm text-gray-600">
                        <Link href="/forgot-password" className="text-blue-600 hover:underline">
                            Forgot your password?
                        </Link>
                    </p>

                    <p className="mt-4 text-center text-sm text-gray-600">
                        Don't have an account? <Link href="/register" className="text-blue-600 hover:underline">Register now</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;

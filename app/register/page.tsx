'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

const RegisterPage = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  // Lazy load hCaptcha/Recaptcha if a site key is configured
  // We avoid bringing in additional npm deps and use the vendor script directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyWindow: any = typeof window !== 'undefined' ? window : {};
  if (typeof window !== 'undefined' && siteKey && !anyWindow.__captchaLoaded) {
    anyWindow.__captchaLoaded = true;
    const isHCaptcha = !!process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
    const script = document.createElement('script');
    script.src = isHCaptcha ? 'https://js.hcaptcha.com/1/api.js?render=explicit' : 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      try {
        const renderFn = isHCaptcha ? anyWindow.hcaptcha?.render : anyWindow.grecaptcha?.render;
        const containerId = 'captcha-container';
        const el = document.getElementById(containerId);
        if (renderFn && el) {
          renderFn(el, {
            sitekey: siteKey,
            callback: (token: string) => setCaptchaToken(token),
          });
        }
      } catch (e) {
        console.warn('Captcha load failed', e);
      }
    };
    document.head.appendChild(script);
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!username.trim() || !email.trim() || !password) {
      setError('Username, email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        username: username.trim(),
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      };
      if (captchaToken) payload.captcha_token = captchaToken;
      if (adminCode && adminCode.trim()) payload.admin_code = adminCode.trim();
      const response = await api.post('/accounts/auth/register/', payload);
      setSuccess('Registration successful. Please check your email to verify your account before logging in.');
    } catch (err: any) {
      console.error('Registration error', err);
      const serverData = err.response?.data;
      const errorMessage = serverData?.detail || (serverData ? JSON.stringify(serverData) : 'Registration failed.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md">
        <form onSubmit={handleRegister} className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Create an Account</h1>
          {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</p>}
          {success && <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{success}</p>}

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">Username</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">First Name</label>
            <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">Last Name</label>
            <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="adminCode">Admin registration code (optional)</label>
            <input id="adminCode" type="text" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} placeholder="Leave empty for employee account" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
          </div>

          {siteKey && (
            <div className="mb-4">
              <div id="captcha-container" />
            </div>
          )}

          <div className="flex items-center justify-between">
            <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300">
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>

          <p className="mt-4 text-center text-sm text-gray-600">Already have an account? <a href="/login" className="text-blue-600 hover:underline">Sign in</a></p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

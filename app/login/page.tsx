'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('/accounts/auth/login/', { username, password });
            
            
            const token = response.data.token || response.data.access;

            if (token) {
                login(token); 
                router.push('/dashboard'); 
            } else {
                setError('Login failed: No token received.');
            }
        } catch (err: any) {
            if (err.response && err.response.data) {
                const errorDetail = err.response.data.detail || (err.response.data.non_field_errors ? err.response.data.non_field_errors.join(' ') : 'Invalid credentials');
                setError(errorDetail);
            } else {
                setError('An unexpected error occurred.');
                console.error(err);
            }
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="w-full max-w-md">
                <form onSubmit={handleLogin} className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
                    <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Secure Document System</h1>
                    <h2 className="text-2xl text-center text-gray-600 mb-8">Login</h2>
                    {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</p>}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300">
                            Sign In
                        </button>
                    </div>
                    <p className="mt-4 text-center text-sm text-gray-600">
                        Don't have an account? <Link href="/register" className="text-blue-600 hover:underline">Register now</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
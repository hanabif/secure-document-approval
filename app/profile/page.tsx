"use client";
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';

export default function ProfilePage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    department: 'OTHER',
    phone_number: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [phoneVerified, setPhoneVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await api.get('/accounts/auth/me/');
        const d = me.data;
        setForm((f) => ({
          ...f,
          username: d.username || '',
          email: d.email || '',
          first_name: d.first_name || '',
          last_name: d.last_name || '',
          department: d.department || 'OTHER',
          phone_number: d.phone_number || '',
          current_password: '',
          new_password: '',
          confirm_password: '',
        }));
        setEmailVerified(!!d.email_verified);
        setPhoneVerified(!!d.phone_verified);
      } catch (e: any) {
        setError(e?.response?.data?.detail || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setForm((f) => ({ ...f, [id]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const payload = { ...form } as any;
      if (!payload.current_password) delete payload.current_password;
      if (!payload.new_password) delete payload.new_password;
      if (!payload.confirm_password) delete payload.confirm_password;
      const res = await api.put('/accounts/auth/profile/', payload);
      setMessage('Profile updated successfully.');
      setEmailVerified(!!res.data.email_verified);
      setPhoneVerified(!!res.data.phone_verified);
      setForm((f) => ({ ...f, current_password: '', new_password: '', confirm_password: '' }));
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to update profile.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">My Profile</h1>
        {loading && <div>Loading...</div>}
        {error && <div className="bg-red-100 text-red-700 p-2 mb-4">{error}</div>}
        {message && <div className="bg-green-100 text-green-700 p-2 mb-4">{message}</div>}
        {!loading && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium">Username</label>
              <input id="username" value={form.username} disabled className="mt-1 block w-full border rounded p-2 bg-gray-100" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <input id="email" value={form.email} onChange={onChange} className="mt-1 block w-full border rounded p-2" />
              <p className="text-xs text-gray-600 mt-1">Verified: {emailVerified ? 'Yes' : 'No'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium">First name</label>
                <input id="first_name" value={form.first_name} onChange={onChange} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium">Last name</label>
                <input id="last_name" value={form.last_name} onChange={onChange} className="mt-1 block w-full border rounded p-2" />
              </div>
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium">Department</label>
              <select id="department" value={form.department} onChange={onChange} className="mt-1 block w-full border rounded p-2">
                <option value="HR">HR</option>
                <option value="IT">IT</option>
                <option value="FINANCE">Finance</option>
                <option value="OPERATIONS">Operations</option>
                <option value="SALES">Sales</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium">Phone number</label>
              <input id="phone_number" value={form.phone_number} onChange={onChange} className="mt-1 block w-full border rounded p-2" />
              <p className="text-xs text-gray-600 mt-1">Verified: {phoneVerified ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium">Current password (required if changing email or password)</label>
              <input id="current_password" type="password" value={form.current_password} onChange={onChange} className="mt-1 block w-full border rounded p-2" />
            </div>
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium">New password</label>
              <input id="new_password" type="password" value={form.new_password} onChange={onChange} className="mt-1 block w-full border rounded p-2" />
            </div>
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium">Confirm new password</label>
              <input id="confirm_password" type="password" value={form.confirm_password} onChange={onChange} className="mt-1 block w-full border rounded p-2" />
            </div>
            <div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save changes</button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

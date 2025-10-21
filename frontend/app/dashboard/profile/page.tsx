'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  address?: string;
  password?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isOpen, setIsOpen] = useState(false);

  // Form state inside modal
  const [form, setForm] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({
    type: '',
    text: '',
  });

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // For closing modal on ESC
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setUser(data);
      } catch (err: any) {
        console.error(err);
        setMessage({ type: 'error', text: err.message || 'Failed to load profile' });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // open modal and prefill form with user data
  const openModal = () => {
    setForm({
      username: user?.username || '',
      email: user?.email || '',
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      password: '',
    });
    setMessage({ type: '', text: '' });
    setShowPassword(false);
    setIsOpen(true);
    // focus trap could be added
  };

  const closeModal = () => {
    setIsOpen(false);
    setForm(null);
    setMessage({ type: '', text: '' });
    setShowPassword(false);
  };

  // handle outside click or ESC to close modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!form) return;
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      // prepare payload (don't send empty password)
      const payload: any = {
        username: form.username,
        email: form.email,
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
      };
      if (form.password && form.password.trim().length > 0) {
        payload.password = form.password;
      }

      const res = await fetch('http://127.0.0.1:8000/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to update profile');
      }

      const updated = await res.json();
      setUser(updated);
      setMessage({ type: 'success', text: '✅ Profile updated successfully' });

      // show spinner and redirect
      setRedirecting(true);
      setTimeout(() => {
        setIsOpen(false);
        setRedirecting(false);
        setForm(null);
        router.push('/dashboard');
      }, 1700);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  // simple in-page spinner
  const Spinner = ({ className = 'h-5 w-5' }: { className?: string }) => (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );

  if (loading) return <div className="p-6 text-gray-600">Loading profile...</div>;
  if (!user) return <div className="p-6 text-red-600">Failed to load profile.</div>;

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4">
      <div className="bg-white p-6 rounded shadow">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account details and preferences.</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Edit Profile
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm text-gray-500">Username</h3>
            <p className="text-gray-800">{user.username}</p>
          </div>
          <div>
            <h3 className="text-sm text-gray-500">Email</h3>
            <p className="text-gray-800">{user.email}</p>
          </div>
          <div>
            <h3 className="text-sm text-gray-500">Full name</h3>
            <p className="text-gray-800">{user.full_name || '—'}</p>
          </div>
          <div>
            <h3 className="text-sm text-gray-500">Phone</h3>
            <p className="text-gray-800">{user.phone || '—'}</p>
          </div>
          <div className="sm:col-span-2">
            <h3 className="text-sm text-gray-500">Address</h3>
            <p className="text-gray-800">{user.address || '—'}</p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          aria-modal="true"
          role="dialog"
        >
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <div
            ref={modalRef}
            className="relative z-60 w-full max-w-2xl bg-white rounded shadow-lg overflow-auto"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Edit Profile</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={closeModal}
                    className="text-gray-600 hover:text-gray-800"
                    aria-label="Close dialog"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {message.text && (
                <div
                  className={`mt-4 p-3 rounded text-sm ${
                    message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    name="username"
                    value={form?.username ?? ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border p-2 rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form?.email ?? ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border p-2 rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Full name</label>
                  <input
                    name="full_name"
                    value={form?.full_name ?? ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border p-2 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    name="phone"
                    value={form?.phone ?? ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border p-2 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    name="address"
                    value={form?.address ?? ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border p-2 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <div className="relative mt-1">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form?.password ?? ''}
                      onChange={handleChange}
                      className="block w-full border p-2 rounded pr-10"
                      placeholder="Leave blank to keep current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {/* Eye icon (toggle) */}
                      {showPassword ? (
                        // eye-off icon
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.99 9.99 0 012.9-6.9M3 3l18 18" />
                        </svg>
                      ) : (
                        // eye icon
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-50"
                    disabled={saving || redirecting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || redirecting}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {saving ? <Spinner className="h-4 w-4" /> : null}
                    Save changes
                  </button>
                </div>

                {redirecting && (
                  <div className="mt-3 flex items-center gap-2 text-blue-600">
                    <Spinner className="h-4 w-4" />
                    <span>Redirecting...</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

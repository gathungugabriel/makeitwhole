'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  return (
    <button onClick={handleLogout} className="text-red-500 hover:underline">
      Logout
    </button>
  );
}

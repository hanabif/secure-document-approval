"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Role } from '@/lib/permissions';
import Loading from './Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: Role[];
}

const roleHomePages: Record<Role, string> = {
    ADMIN: '/admin',
    DIRECTOR: '/manager',
    SENIOR_MANAGER: '/manager',
    MANAGER: '/manager',
    USER: '/dashboard',
};

const normalizeRole = (role: any): Role => {
  if (typeof role === 'string') {
    // numeric string -> number mapping
    if (/^\d+$/.test(role)) {
      const n = parseInt(role, 10);
      if (n === 99) return 'ADMIN';
      if (n === 3) return 'DIRECTOR';
      if (n === 2) return 'SENIOR_MANAGER';
      if (n === 1) return 'MANAGER';
      return 'USER';
    }
    // already named
    const upper = role.toUpperCase();
    if (upper === 'ADMIN') return 'ADMIN';
    if (upper === 'DIRECTOR') return 'DIRECTOR';
    if (upper === 'SENIOR_MANAGER') return 'SENIOR_MANAGER';
    if (upper === 'MANAGER') return 'MANAGER';
    return 'USER';
  }
  if (typeof role === 'number') {
    if (role === 99) return 'ADMIN';
    if (role === 3) return 'DIRECTOR';
    if (role === 2) return 'SENIOR_MANAGER';
    if (role === 1) return 'MANAGER';
    return 'USER';
  }
  return 'USER';
};

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait for the auth state to be determined
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // If roles are specified, check for authorization
    if (roles && roles.length > 0 && user) {
      const r = normalizeRole(user.role);
      if (!roles.includes(r)) {
        const homePage = roleHomePages[r] || '/dashboard';
        router.replace(homePage);
      }
    }
  }, [isAuthenticated, loading, user, roles, router]);

  if (loading || !isAuthenticated) {
    return <Loading />;
  }
  
  
  if (roles && roles.length > 0 && user && !roles.includes(normalizeRole(user.role))) {
    return <Loading />; // Or a redirection component
  }

  return <>{children}</>;
};

export default ProtectedRoute;
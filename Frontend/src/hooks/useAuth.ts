'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setCredentials, clearCredentials } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  const login = (userData: { id: string; email: string; name: string }, token: string) => {
    dispatch(setCredentials({ user: userData, token }));
    router.push('/dashboard');
  };

  const logout = () => {
    dispatch(clearCredentials());
    router.push('/login');
  };

  return {
    user,
    token,
    login,
    logout
  };
};

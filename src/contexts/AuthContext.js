import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [emailForOtp, setEmailForOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setUser(data?.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      // Log auth events for debugging
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        console.log('[Auth]', event, session ? 'with session' : 'no session');
      }
      
      // Handle token refresh failures
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('[Auth] Token refresh failed, user will be logged out');
        setAuthError('Session expired. Please sign in again.');
      }
      
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const sendMagicLink = useCallback(
    async (email) => {
      if (!supabase) {
        throw new Error('Sync login is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
      }

      setIsProcessing(true);
      setAuthError(null);
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true
          }
        });
        if (error) {
          throw error;
        }
        setEmailForOtp(email);
        setOtpSent(true);
      } catch (error) {
        setAuthError(error.message || 'Failed to send code');
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [supabase]
  );

  const verifyMagicCode = useCallback(
    async (code) => {
      if (!supabase) {
        throw new Error('Sync login is not configured.');
      }
      if (!emailForOtp) {
        throw new Error('Enter your email first.');
      }

      setIsProcessing(true);
      setAuthError(null);
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: emailForOtp,
          token: code,
          type: 'email'
        });
        if (error) {
          throw error;
        }
        const verifiedUser = data?.user ?? data?.session?.user ?? null;
        setUser(verifiedUser);
        setOtpSent(false);
        setEmailForOtp('');
      } catch (error) {
        setAuthError(error.message || 'Invalid code');
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [supabase, emailForOtp]
  );

  const signOut = useCallback(async () => {
    if (!supabase) {
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setOtpSent(false);
    setEmailForOtp('');
    setAuthError(null);
  }, [supabase]);

  const resetAuthFlow = useCallback(() => {
    setOtpSent(false);
    setEmailForOtp('');
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        isProcessing,
        otpSent,
        emailForOtp,
        sendMagicLink,
        verifyMagicCode,
        signOut,
        resetAuthFlow,
        isConfigured: !!supabase
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

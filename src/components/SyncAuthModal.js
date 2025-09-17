import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeInput } from '../utils/security';

const EMAIL_STEP = 'email';
const CODE_STEP = 'code';

const SyncAuthModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const {
    user,
    sendMagicLink,
    verifyMagicCode,
    otpSent,
    authError,
    isProcessing,
    resetAuthFlow,
    isConfigured
  } = useAuth();
  const [step, setStep] = useState(EMAIL_STEP);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setStep(EMAIL_STEP);
      setEmail('');
      setCode('');
      setLocalError('');
      resetAuthFlow();
    }
  }, [isOpen, resetAuthFlow]);

  useEffect(() => {
    if (otpSent) {
      setStep(CODE_STEP);
    }
  }, [otpSent]);

  useEffect(() => {
    if (user && isOpen) {
      onClose();
    }
  }, [user, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSendEmail = async (event) => {
    event.preventDefault();
    const normalizedEmail = sanitizeInput(email.trim().toLowerCase());
    if (!normalizedEmail) {
      setLocalError('Please enter an email address.');
      return;
    }

    try {
      setLocalError('');
      await sendMagicLink(normalizedEmail);
    } catch (error) {
      setLocalError(error.message || 'Could not send code.');
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    const trimmed = sanitizeInput(code.trim());
    if (!trimmed || trimmed.length < 4) {
      setLocalError('Enter the code you received via email.');
      return;
    }

    try {
      setLocalError('');
      await verifyMagicCode(trimmed);
      onClose();
    } catch (error) {
      setLocalError(error.message || 'Invalid code.');
    }
  };

  const disabled = isProcessing;
  const errorMessage = localError || authError;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
    >
      <div className={`${theme.bg} ${theme.border} border max-w-sm w-full p-6 space-y-4 shadow-lg`}>
        <div className="flex items-center justify-between">
          <h2 className={`dynamic-text-lg font-light ${theme.text}`}>
            Sync with email
          </h2>
          <button
            onClick={onClose}
            className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
          >
            [close]
          </button>
        </div>

        {!isConfigured && (
          <div className={`dynamic-text-xs ${theme.textTertiary}`}>
            Sync login isn&apos;t configured yet. Add your Supabase credentials via
            <code className="mx-1">REACT_APP_SUPABASE_URL</code>
            and
            <code className="ml-1">REACT_APP_SUPABASE_ANON_KEY</code>
            environment variables.
          </div>
        )}

        {step === EMAIL_STEP && (
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <label className={`dynamic-text-xs font-light ${theme.textTertiary} block mb-2`}>
                Enter your email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={`w-full bg-transparent border-b ${theme.border} pb-2 dynamic-text-sm font-light ${theme.text} focus:outline-none`}
                placeholder="you@example.com"
                required
              />
            </div>
            {errorMessage && (
              <div className="text-red-500 text-xs font-light">{errorMessage}</div>
            )}
            <button
              type="submit"
              disabled={disabled || !isConfigured}
              className={`w-full border ${theme.border} px-3 py-2 dynamic-text-xs font-light ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')} transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {disabled ? 'Sending…' : 'Send code'}
            </button>
          </form>
        )}

        {step === CODE_STEP && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <div className={`dynamic-text-xs font-light ${theme.textTertiary} mb-2`}>
                Enter the 6-digit code we emailed you.
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ''))}
                className={`w-full bg-transparent border-b ${theme.border} pb-2 dynamic-text-lg tracking-[0.4em] text-center ${theme.text} focus:outline-none`}
                maxLength={6}
                placeholder="••••••"
                required
              />
            </div>
            {errorMessage && (
              <div className="text-red-500 text-xs font-light text-center">{errorMessage}</div>
            )}
            <button
              type="submit"
              disabled={disabled}
              className={`w-full border ${theme.border} px-3 py-2 dynamic-text-xs font-light ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')} transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {disabled ? 'Verifying…' : 'Verify code'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(EMAIL_STEP);
                setCode('');
                resetAuthFlow();
              }}
              className={`w-full text-center dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SyncAuthModal;

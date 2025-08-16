import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Mail, Globe, ArrowLeft, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { showSuccess, showError } from '../utils/toast';
import axios from 'axios';

const VerifyEmailPage = () => {
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const verificationAttempted = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useParams();
  const { resendVerification } = useAuth();

  // Get email and status from query params
  const searchParams = new URLSearchParams(location.search);
  const email = location.state?.email || searchParams.get('email');
  const firstName = location.state?.firstName || '';
  const success = searchParams.get('success');
  const error = searchParams.get('error');

  useEffect(() => {
    if (success === 'true') {
      setVerificationStatus('success');
    } else if (error === 'invalid_token' || error === 'server_error') {
      setVerificationStatus('error');
    } else if (token && !verificationStatus && !verificationAttempted.current) {
      // If there's a token in the URL and no status set yet, verify it
      verificationAttempted.current = true;
      handleEmailVerification(token);
    }
  }, [success, error, token, verificationStatus]);

  const handleEmailVerification = async (verificationToken) => {
    setIsVerifying(true);
    console.log('Starting verification for token:', verificationToken);

    try {
      const response = await axios.get(`/api/auth/verify-email/${verificationToken}`);
      console.log('Verification response:', response.data);

      if (response.data.success) {
        setVerificationStatus('success');
        // Extract email from the response or use a default
        const userEmail = response.data.email || email;
        console.log('Verification successful for email:', userEmail);
        // Don't navigate here to avoid state conflicts
      }
    } catch (error) {
      console.error('Verification error:', error);
      console.error('Error response:', error.response?.data);
      setVerificationStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      showError('Email address not found. Please try signing up again.');
      return;
    }

    setIsResending(true);
    try {
      await resendVerification(email);
      showSuccess('Verification email sent successfully!');
    } catch (error) {
      showError(error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  // Success State
  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>

            <div className="flex justify-center mb-4">
              <div className="bg-primary-600 p-3 rounded-full">
                <Globe className="h-8 w-8 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h2>
            <p className="text-gray-600">
              Your account has been successfully activated
            </p>
          </div>

          {/* Success Card */}
          <div className="card animate-fade-in">
            <div className="text-center space-y-6">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="bg-green-100 p-4 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Welcome to GlobeTrotter!
                </h3>

                <p className="text-gray-600">
                  Your email has been verified successfully. You can now sign in to your account and start planning your adventures!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleGoToLogin}
                  className="btn-primary w-full"
                >
                  Sign In to Your Account
                </button>

                <Link to="/" className="btn-outline w-full block text-center">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>

            <div className="flex justify-center mb-4">
              <div className="bg-primary-600 p-3 rounded-full">
                <Globe className="h-8 w-8 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600">
              The verification link is invalid or has expired
            </p>
          </div>

          {/* Error Card */}
          <div className="card animate-fade-in">
            <div className="text-center space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="bg-red-100 p-4 rounded-full">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Invalid Verification Link
                </h3>

                <p className="text-gray-600">
                  {error === 'server_error'
                    ? 'There was an error processing your verification. Please try again or contact support.'
                    : 'The verification link you clicked is either invalid or has expired. Please request a new verification email.'
                  }
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {email && (
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="btn-primary w-full flex items-center justify-center"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </button>
                )}

                <Link to="/signup" className="btn-outline w-full block text-center">
                  Create New Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading State (Verifying email)
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>

            <div className="flex justify-center mb-4">
              <div className="bg-primary-600 p-3 rounded-full">
                <Globe className="h-8 w-8 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Verifying Email
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your email address
            </p>
          </div>

          {/* Loading Card */}
          <div className="card animate-fade-in">
            <div className="text-center space-y-6">
              {/* Loading Icon */}
              <div className="flex justify-center">
                <div className="bg-blue-100 p-4 rounded-full">
                  <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Verifying your email address
                </h3>

                <p className="text-gray-600">
                  This should only take a moment...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default State (Waiting for verification)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          <div className="flex justify-center mb-4">
            <div className="bg-primary-600 p-3 rounded-full">
              <Globe className="h-8 w-8 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Check Your Email
          </h2>
          <p className="text-gray-600">
            We've sent you a verification link
          </p>
        </div>

        {/* Verification Card */}
        <div className="card animate-fade-in">
          <div className="text-center space-y-6">
            {/* Email Icon */}
            <div className="flex justify-center">
              <div className="bg-green-100 p-4 rounded-full">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Verify your email address
              </h3>

              <p className="text-gray-600">
                {firstName ? `Hi ${firstName}, ` : ''}We've sent a verification link to:
              </p>

              {email && (
                <p className="text-primary-600 font-medium break-all">
                  {email}
                </p>
              )}

              <p className="text-gray-600 text-sm">
                Click the link in the email to verify your account and start planning your adventures!
              </p>
            </div>

            {/* Resend Button */}
            {email && (
              <div className="pt-4">
                <p className="text-gray-500 text-sm mb-3">
                  Didn't receive the email?
                </p>
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="btn-outline flex items-center justify-center mx-auto"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend verification email'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Check your email inbox (and spam folder)</li>
              <li>• Click the verification link in the email</li>
              <li>• You'll be redirected to GlobeTrotter</li>
              <li>• Start planning your first trip!</li>
            </ul>
          </div>

          <p className="text-gray-600">
            Already verified?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Globe } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { showError } from '../utils/toast';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error) {
      showError(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8">
              <Globe className="h-6 w-6 mr-2" />
              <span className="text-xl font-bold">GlobeTrotter</span>
            </Link>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <div className="relative">
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  placeholder="Email"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <Lock className="absolute right-10 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          {/* Links */}
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>

            <Link
              to="/forgot-password"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </div>

      {/* Right Section - Beach Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-cyan-100 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Beach Scene Illustration */}
          <div className="relative w-full h-full">
            {/* Sky */}
            <div className="absolute top-0 left-0 right-0 h-2/3 bg-gradient-to-b from-blue-200 to-blue-300">
              {/* Clouds */}
              <div className="absolute top-20 left-20 w-24 h-12 bg-white rounded-full opacity-80"></div>
              <div className="absolute top-16 left-32 w-16 h-8 bg-white rounded-full opacity-80"></div>
              <div className="absolute top-24 left-48 w-20 h-10 bg-white rounded-full opacity-80"></div>
              <div className="absolute top-32 right-32 w-28 h-14 bg-white rounded-full opacity-80"></div>
              <div className="absolute top-20 right-16 w-20 h-10 bg-white rounded-full opacity-80"></div>
            </div>

            {/* Ocean */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-cyan-400 to-cyan-300">
              {/* Sailboat */}
              <div className="absolute bottom-20 right-32">
                <div className="w-8 h-12 bg-white rounded-t-full"></div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-gray-800"></div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-gray-800"></div>
              </div>
            </div>

            {/* Beach */}
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-yellow-200 to-yellow-100"></div>

            {/* Person on Beach Buggy */}
            <div className="absolute bottom-1/4 left-1/3">
              {/* Beach Buggy */}
              <div className="w-24 h-12 bg-yellow-300 rounded-lg relative">
                <div className="absolute -top-1 left-2 w-20 h-2 bg-yellow-400 rounded"></div>
                <div className="absolute -top-1 right-2 w-20 h-2 bg-yellow-400 rounded"></div>
                <div className="absolute bottom-1 left-2 w-4 h-4 bg-gray-800 rounded-full"></div>
                <div className="absolute bottom-1 right-2 w-4 h-4 bg-gray-800 rounded-full"></div>
              </div>

              {/* Person */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                {/* Head */}
                <div className="w-6 h-6 bg-yellow-200 rounded-full"></div>
                {/* Hat */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-yellow-100 rounded-full"></div>
                {/* Body */}
                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-4 h-6 bg-blue-200 rounded"></div>
                {/* Shorts */}
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-5 h-3 bg-yellow-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

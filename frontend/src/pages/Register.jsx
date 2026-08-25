import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../store/authSlice.js';
import logger from '../utils/logger.js';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { error, isLoading } = useSelector((state) => state.auth);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
    mode: 'onTouched',
  });

  // Clear any existing auth errors when the component mounts or unmounts (route switch)
  useEffect(() => {
    dispatch(clearError());
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Clear error when the user starts typing in any field
  const handleInputChange = () => {
    if (error) {
      dispatch(clearError());
    }
  };

  const onSubmit = async (data) => {
    try {
      await dispatch(
        register({
          username: data.username.trim(),
          email: data.email.trim(),
          password: data.password,
        })
      ).unwrap();

      logger.info('User registered successfully');
      navigate('/login');
    } catch (err) {
      logger.error({ err }, 'Registration error');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Ambient Depth Glowing Orbs */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-indigo-400/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Authentication Card */}
      <div className="relative max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/60 p-8 md:p-10">
        {/* Top Logo & Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center justify-center space-x-2 group">
            <div className="w-10 h-10 rounded-xl bg-[#1E1B4B] flex items-center justify-center text-white font-bold text-xl shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[#1E1B4B]">
              NotesFlow
            </span>
          </Link>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight text-center mt-6">
            Create your account
          </h1>
          <p className="text-sm text-slate-500 text-center mt-2 mb-8 font-normal">
            Sign up to start organizing your notes.
          </p>
        </div>

        {/* Dynamic backend error display from Redux state */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-700 flex items-start space-x-2.5"
          >
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Username Field */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="johndoe123"
              {...registerField('username', {
                required: 'Username is required',
                minLength: {
                  value: 3,
                  message: 'Username must be at least 3 characters',
                },
                maxLength: {
                  value: 20,
                  message: 'Username cannot exceed 20 characters',
                },
                pattern: {
                  value: /^[a-zA-Z0-9]+$/,
                  message: 'Username must be alphanumeric (letters and numbers only)',
                },
                onChange: handleInputChange,
              })}
              className={`bg-slate-50 border rounded-xl px-4 py-3 w-full text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
                errors.username
                  ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
            />
            {errors.username && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...registerField('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
                onChange: handleInputChange,
              })}
              className={`bg-slate-50 border rounded-xl px-4 py-3 w-full text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              {...registerField('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
                onChange: handleInputChange,
              })}
              className={`bg-slate-50 border rounded-xl px-4 py-3 w-full text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-slate-900 text-white font-semibold rounded-full w-full py-3.5 mt-6 shadow-md shadow-slate-900/10 hover:bg-slate-800 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex justify-center items-center text-sm"
          >
            {isLoading ? (
              <span className="inline-flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating Account...
              </span>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        {/* Separator & Footer Link */}
        <div className="border-t border-slate-100 my-6" />

        <p className="text-sm text-slate-500 text-center">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-[#1E1B4B] hover:text-indigo-700 hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

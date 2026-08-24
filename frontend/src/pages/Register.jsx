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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-zinc-800">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center space-x-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              ⚡
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">
            Sign up to start organizing your notes
          </p>
        </div>

        {/* Dynamic backend error display from Redux state */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-sm text-red-700 dark:text-red-300 flex items-start space-x-2.5"
          >
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Username Field */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
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
              className={`w-full px-4 py-2.5 rounded-lg border text-gray-900 dark:text-white bg-white dark:bg-zinc-800 transition duration-150 focus:outline-none focus:ring-2 ${
                errors.username
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-gray-300 dark:border-zinc-700 focus:ring-indigo-500 focus:border-transparent'
              }`}
            />
            {errors.username && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
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
              className={`w-full px-4 py-2.5 rounded-lg border text-gray-900 dark:text-white bg-white dark:bg-zinc-800 transition duration-150 focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-gray-300 dark:border-zinc-700 focus:ring-indigo-500 focus:border-transparent'
              }`}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
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
              className={`w-full px-4 py-2.5 rounded-lg border text-gray-900 dark:text-white bg-white dark:bg-zinc-800 transition duration-150 focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-gray-300 dark:border-zinc-700 focus:ring-indigo-500 focus:border-transparent'
              }`}
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 shadow-md shadow-indigo-600/20 cursor-pointer"
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
              'Sign Up Free'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-zinc-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, clearError } from "../store/authSlice.js";
import logger from "../utils/logger.js";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { status, userData, isLoading, error } = useSelector(
    (state) => state.auth,
  );
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (status || userData) {
      navigate("/dashboard", { replace: true });
    }
  }, [status, userData, navigate]);

  useEffect(() => {
    dispatch(clearError());
    setErrorMsg("");
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleInputChange = () => {
    if (errorMsg) {
      setErrorMsg("");
    }
    if (error) {
      dispatch(clearError());
    }
  };

  const onSubmit = async (data) => {
    setErrorMsg("");
    try {
      await dispatch(
        login({
          email: data.email.trim(),
          password: data.password,
        }),
      ).unwrap();

      logger.info("User logged in successfully");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      logger.error({ err }, "Login error");
      const message =
        typeof err === "string"
          ? err
          : err?.response?.data?.message || err?.message || "Login failed";
      setErrorMsg(message);
    }
  };

  const displayError = errorMsg || error;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 overflow-hidden selection:bg-indigo-500 selection:text-white">
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-indigo-400/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="relative max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/60 p-8 md:p-10">
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center space-x-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1E1B4B] flex items-center justify-center text-white font-bold text-xl shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[#1E1B4B]">
              NotesFlow
            </span>
          </Link>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight text-center mt-6">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500 text-center mt-2 mb-8 font-normal">
            Sign in to access your personal workspace.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Email Address or Username
            </label>
            <input
              id="email"
              type="text"
              placeholder="you@example.com"
              {...register("email", {
                required: "Email address or username is required",
                onChange: handleInputChange,
              })}
              className={`bg-slate-50 border rounded-xl px-4 py-3 w-full text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
                errors.email
                  ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                  : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
              }`}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

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
              {...register("password", {
                required: "Password is required",
                onChange: handleInputChange,
              })}
              className={`bg-slate-50 border rounded-xl px-4 py-3 w-full text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
                errors.password
                  ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                  : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
              }`}
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          {displayError && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-700 flex items-start space-x-2.5"
            >
              <svg
                className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{displayError}</span>
            </div>
          )}

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
                Signing In...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="border-t border-slate-100 my-6" />

        <p className="text-sm text-slate-500 text-center">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-bold text-[#1E1B4B] hover:text-blue-700 hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

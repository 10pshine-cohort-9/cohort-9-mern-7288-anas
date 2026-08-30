import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, clearError } from "../store/authSlice.js";
import logger from "../utils/logger.js";
import AuthLayout from "../layouts/AuthLayout.jsx";
import FormInput from "../components/FormInput.jsx";
import AuthSubmitButton from "../components/AuthSubmitButton.jsx";

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
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (status || userData) {
      navigate("/dashboard", { replace: true });
    }
  }, [status, userData, navigate]);

  useEffect(() => {
    dispatch(clearError());
    return () => dispatch(clearError());
  }, [dispatch]);

  const handleInputChange = () => {
    if (errorMsg) setErrorMsg("");
    if (error) dispatch(clearError());
  };

  const onSubmit = async (data) => {
    setErrorMsg("");
    try {
      await dispatch(
        login({ email: data.email.trim(), password: data.password }),
      ).unwrap();
      logger.info("User logged in successfully");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      logger.error({ err }, "Login error");
      setErrorMsg(
        typeof err === "string"
          ? err
          : err?.response?.data?.message || err?.message || "Login failed",
      );
    }
  };

  const displayError = errorMsg || error;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your personal workspace."
      footerText="Don't have an account?"
      footerLinkText="Sign Up"
      footerLinkTo="/register"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormInput
          id="email"
          label="Email Address or Username"
          type="text"
          placeholder="you@example.com"
          error={errors.email}
          registerReturn={register("email", {
            required: "Email address or username is required",
            onChange: handleInputChange,
          })}
        />

        <FormInput
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password}
          registerReturn={register("password", {
            required: "Password is required",
            onChange: handleInputChange,
          })}
        />

        {displayError && (
          <div
            role="alert"
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

        <AuthSubmitButton
          isLoading={isLoading}
          text="Sign In"
          loadingText="Signing In..."
        />
      </form>
    </AuthLayout>
  );
};

export default Login;

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register, clearError } from "../store/authSlice.js";
import logger from "../utils/logger.js";
import AuthLayout from "../layouts/AuthLayout.jsx";
import FormInput from "../components/FormInput.jsx";
import AuthSubmitButton from "../components/AuthSubmitButton.jsx";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { error, isLoading } = useSelector((state) => state.auth);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { username: "", email: "", password: "" },
    mode: "onTouched",
  });

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
        register({
          username: data.username.trim(),
          email: data.email.trim(),
          password: data.password,
        }),
      ).unwrap();
      logger.info("User registered successfully");
      navigate("/login");
    } catch (err) {
      logger.error({ err }, "Registration error");
      setErrorMsg(
        typeof err === "string"
          ? err
          : err?.response?.data?.message ||
              err?.message ||
              "Registration failed",
      );
    }
  };

  const displayError = errorMsg || error;

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Sign up to start organizing your notes."
      footerText="Already have an account?"
      footerLinkText="Sign In"
      footerLinkTo="/login"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormInput
          id="username"
          label="Username"
          type="text"
          placeholder="johndoe123"
          error={errors.username}
          registerReturn={registerField("username", {
            required: "Username is required",
            minLength: {
              value: 3,
              message: "Username must be at least 3 characters",
            },
            maxLength: {
              value: 20,
              message: "Username cannot exceed 20 characters",
            },
            pattern: {
              value: /^[a-zA-Z0-9]+$/,
              message:
                "Username must be alphanumeric (letters and numbers only)",
            },
            onChange: handleInputChange,
          })}
        />

        <FormInput
          id="email"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          error={errors.email}
          registerReturn={registerField("email", {
            required: "Email address is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Please enter a valid email address",
            },
            onChange: handleInputChange,
          })}
        />

        <FormInput
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password}
          registerReturn={registerField("password", {
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
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
          text="Sign Up"
          loadingText="Creating Account..."
        />
      </form>
    </AuthLayout>
  );
};

export default Register;

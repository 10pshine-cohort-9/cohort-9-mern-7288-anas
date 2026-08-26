import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../utils/axiosInstance";
import { updateSubscriptionPlan } from "../store/authSlice.js";

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status: isAuthenticated } = useSelector((state) => state.auth);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [planError, setPlanError] = useState(null);

  const handleStarterPlan = async () => {
    if (isAuthenticated) {
      setLoadingPlan("Starter");
      setPlanError(null);
      try {
        await dispatch(updateSubscriptionPlan("Starter")).unwrap();
        navigate("/dashboard");
      } catch (err) {
        console.error("Failed to change plan to Starter:", err);
        const errorMessage =
          typeof err === "string"
            ? err
            : err?.message || "Failed to update subscription to Starter plan.";
        setPlanError(errorMessage);
      } finally {
        setLoadingPlan(null);
      }
    } else {
      navigate("/register");
    }
  };

  const handleCheckout = async (priceId, planName) => {
    setLoadingPlan(planName);
    setPlanError(null);
    try {
      const response = await axiosInstance.post(
        "/stripe/create-checkout-session",
        {
          priceId,
          planName,
        },
      );
      const url = response.data?.url || response.data?.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        const errorMsg =
          "Checkout URL not received from server. Please try again.";
        console.error(errorMsg);
        setPlanError(errorMsg);
        setLoadingPlan(null);
      }
    } catch (error) {
      console.error("Stripe checkout error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to initiate checkout. Please try again.";
      setPlanError(errorMessage);
      setLoadingPlan(null);
    }
  };

  return (
    <div className="relative isolate min-h-screen bg-[#F9FAFB] text-slate-900 selection:bg-indigo-500 selection:text-white flex flex-col font-sans overflow-x-hidden">
      <header className="sticky top-4 z-50 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="relative bg-white/40 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08)] rounded-full px-6 py-2.5 flex items-center justify-between transition-all hover:bg-white/55">
          <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

          <Link
            to="/"
            className="flex items-center space-x-2 group relative z-10"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">
              ⚡
            </span>
            <span className="font-bold text-xl tracking-tight text-[#1E1B4B]">
              NotesFlow
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600 relative z-10">
            <a
              href="#features"
              className="hover:text-[#1E1B4B] transition-colors"
            >
              Features
            </a>

            <a
              href="#pricing"
              className="hover:text-[#1E1B4B] transition-colors"
            >
              Pricing
            </a>
          </nav>

          <div className="flex items-center space-x-3 relative z-10">
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="px-5 py-2 text-xs font-semibold rounded-full bg-[#1E1B4B] hover:bg-[#2D2A6E] text-white shadow-md shadow-indigo-950/20 transition-all hover:scale-[1.02]"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 max-w-7xl mx-auto px-6 pt-12 md:pt-16 pb-20 items-start relative">
          <div className="lg:col-span-7 flex flex-col text-left">
            <div>
              <span className="bg-slate-100/90 border border-slate-200/80 text-slate-600 text-xs font-medium px-4 py-1.5 rounded-full inline-block mb-6 shadow-sm">
                • Notes Editor • Powered by React & Cloudinary
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#1E1B4B] leading-[1.1] max-w-2xl">
              Your Mind, Organized. <br className="hidden sm:inline" />
              Capture ideas at the speed of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                thought.
              </span>
            </h1>

            <p className="mt-5 text-slate-500 text-base sm:text-lg max-w-xl leading-relaxed font-normal">
              Experience a seamless, distraction-free workspace. Write rich text
              with effortless formatting, upload inline images to the cloud, and
              enjoy real-time auto-saving.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-8">
              <Link
                to={isAuthenticated ? "/dashboard" : "/register"}
                className="bg-[#1E1B4B] hover:bg-[#2D2A6E] text-white rounded-full px-7 py-3 text-sm font-semibold shadow-lg shadow-indigo-950/20 transition-all hover:scale-[1.02] inline-flex items-center space-x-2"
              >
                <span>
                  {isAuthenticated ? "Open Dashboard" : "Get Started Free"}
                </span>
                <span>&rarr;</span>
              </Link>

              <Link
                to={isAuthenticated ? "/dashboard" : "/login"}
                className="bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 rounded-full px-7 py-3 text-sm font-semibold shadow-sm transition-all hover:scale-[1.02]"
              >
                {isAuthenticated ? "View My Notes" : "Log In"}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-5 mt-6 text-xs font-medium text-slate-600">
              <div className="flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                  ✓
                </span>
                <span>Instant Auto-Save</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                  ✓
                </span>
                <span>Cloudinary Cloud Media</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                  ✓
                </span>
                <span>JWT Authentication</span>
              </div>
            </div>
          </div>

          <div id="features" className="lg:col-span-5 relative mt-12 lg:mt-0">
            <div className="absolute -inset-10 bg-gradient-to-br from-blue-400/40 via-indigo-400/35 to-purple-500/40 blur-[100px] rounded-full pointer-events-none -z-10" />

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all text-left flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-pink-100/70 flex items-center justify-center text-base mb-3">
                    🚀
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    Rich Text Editing
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Notion-style interface powered by React Quill. Headers,
                    bullet lists, code syntax, quotes, and clean formatting.
                  </p>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all text-left flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-blue-100/70 flex items-center justify-center text-base mb-3">
                    ☁️
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    Cloud Integration
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Seamless inline image uploads powered by Cloudinary with
                    automatic cleanup when images are removed.
                  </p>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all text-left flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-100/70 flex items-center justify-center text-base mb-3">
                    ⚡
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    Smart Auto-Save
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Never lose a thought. Debounced background auto-save and
                    atomic revision tracking protect your work in real-time.
                  </p>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all text-left flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-rose-100/70 flex items-center justify-center text-base mb-3">
                    🔒
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    Secure & Private
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Robust JWT authentication, secure session persistence, and
                    scoped ownership keep your notes safe.
                  </p>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all text-left flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-sky-100/70 flex items-center justify-center text-base mb-3">
                    🛡️
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    User Scoped Access
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Strict database query boundaries ensure only authenticated
                    owners can access or edit their notes.
                  </p>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all text-left flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-purple-100/70 flex items-center justify-center text-base mb-3">
                    🔮
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    Resilient Auto-Save
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Atomic revision control, debounced background saves, and
                    unmount flushing protect against data loss.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="security" className="sr-only">
          Security Section Anchor
        </section>

        <section id="pricing" className="mt-20 max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Choose the perfect plan for your personal knowledge management and
              team collaboration.
            </p>
          </div>

          {planError && (
            <div
              aria-live="polite"
              role="alert"
              className="mt-6 max-w-2xl mx-auto p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center shadow-xs flex items-center justify-center space-x-2"
            >
              <span className="text-rose-500 font-bold">⚠️</span>
              <span>{planError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 items-stretch">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-lg shadow-slate-200/50 flex flex-col justify-between hover:border-slate-300 transition-colors text-left">
              <div>
                <h3 className="text-base font-bold text-slate-900">Starter</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Perfect for individuals getting started
                </p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-3xl font-extrabold text-slate-900">
                    $0
                  </span>
                  <span className="text-slate-500 text-xs ml-1">/mo</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-600">
                  <li className="flex items-center space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Up to 50 active notes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>React Quill rich editor</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Basic Cloudinary storage</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Standard auto-save</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleStarterPlan}
                  disabled={loadingPlan !== null}
                  className="block w-full py-2.5 px-4 rounded-full border border-slate-200/80 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-center text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loadingPlan === "Starter"
                    ? "Updating Plan..."
                    : "Get Started Free"}
                </button>
              </div>
            </div>

            <div className="bg-[#1E1B4B] text-white rounded-2xl p-8 shadow-2xl shadow-indigo-950/30 flex flex-col justify-between relative md:-translate-y-4 border border-slate-800 text-left">
              <div>
                <span className="bg-indigo-500 text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-3">
                  Most Popular
                </span>
                <h3 className="text-base font-bold text-white">Pro Creator</h3>
                <p className="text-xs text-slate-400 mt-1">
                  For power users and serious note-takers
                </p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-3xl font-extrabold text-white">$8</span>
                  <span className="text-slate-400 text-xs ml-1">/mo</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <span className="text-indigo-400 font-bold">✓</span>
                    <span>Unlimited active notes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-indigo-400 font-bold">✓</span>
                    <span>Stripe subscription integration</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-indigo-400 font-bold">✓</span>
                    <span>Unlimited Cloudinary media</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-indigo-400 font-bold">✓</span>
                    <span>Revision history & atomic saves</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-indigo-400 font-bold">✓</span>
                    <span>Priority customer support</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() =>
                    handleCheckout(
                      import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
                      "Pro Creator",
                    )
                  }
                  disabled={loadingPlan !== null}
                  className="block w-full py-2.5 px-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all text-center text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loadingPlan === "Pro Creator"
                    ? "Redirecting..."
                    : "Upgrade to Pro"}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-lg shadow-slate-200/50 flex flex-col justify-between hover:border-slate-300 transition-colors text-left">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Team Workspace
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  For organizations and collaborative teams
                </p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-3xl font-extrabold text-slate-900">
                    $24
                  </span>
                  <span className="text-slate-500 text-xs ml-1">/mo</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-600">
                  <li className="flex items-center space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Everything in Pro plan</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Shared team workspaces</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Granular role permissions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Dedicated account manager</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() =>
                    handleCheckout(
                      import.meta.env.VITE_STRIPE_TEAM_PRICE_ID,
                      "Team Workspace",
                    )
                  }
                  disabled={loadingPlan !== null}
                  className="block w-full py-2.5 px-4 rounded-full border border-slate-200/80 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-center text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loadingPlan === "Team Workspace"
                    ? "Redirecting..."
                    : "Upgrade to Team"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/50 p-10 mt-20 mb-20 text-center relative overflow-hidden px-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 pointer-events-none" />

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] tracking-tight relative z-10">
            Ready to supercharge your notes?
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto relative z-10">
            Join today and enjoy a clean, fast, and secure workspace for all
            your ideas and projects.
          </p>

          <div className="mt-6 flex justify-center relative z-10">
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="inline-flex items-center space-x-2 px-7 py-3 rounded-full bg-[#1E1B4B] hover:bg-[#2D2A6E] text-white text-xs font-semibold shadow-lg shadow-indigo-950/20 transition-all hover:scale-[1.02]"
            >
              <span>
                {isAuthenticated ? "Go to My Dashboard" : "Create Your Account"}
              </span>
              <span>&rarr;</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <Link to="/" className="flex items-center space-x-1.5">
            <span className="text-base">⚡</span>
            <span className="font-bold text-[#1E1B4B] text-sm">NotesFlow</span>
          </Link>

          <div className="flex items-center space-x-6">
            <a
              href="#features"
              className="hover:text-slate-900 transition-colors"
            >
              Features
            </a>

            <a
              href="#pricing"
              className="hover:text-slate-900 transition-colors"
            >
              Pricing
            </a>
            <Link
              to="/login"
              className="hover:text-slate-900 transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="hover:text-slate-900 transition-colors"
            >
              Register
            </Link>
          </div>

          <div>&copy; 2026 NotesFlow. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

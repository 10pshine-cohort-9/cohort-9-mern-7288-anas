import { Link } from "react-router-dom";

const AuthLayout = ({
  title,
  subtitle,
  footerText,
  footerLinkText,
  footerLinkTo,
  children,
}) => {
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
            {title}
          </h1>
          <p className="text-sm text-slate-500 text-center mt-2 mb-8 font-normal">
            {subtitle}
          </p>
        </div>

        {children}

        <div className="border-t border-slate-100 my-6" />

        <p className="text-sm text-slate-500 text-center">
          {footerText}{" "}
          <Link
            to={footerLinkTo}
            className="font-bold text-[#1E1B4B] hover:text-blue-700 hover:underline"
          >
            {footerLinkText}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;

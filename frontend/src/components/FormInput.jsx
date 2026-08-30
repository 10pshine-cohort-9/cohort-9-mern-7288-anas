const FormInput = ({ id, label, type, placeholder, registerReturn, error }) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-700 mb-1.5"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        {...registerReturn}
        className={`bg-slate-50 border rounded-xl px-4 py-3 w-full text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
          error
            ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
            : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
        }`}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-medium">
          {error.message}
        </p>
      )}
    </div>
  );
};

export default FormInput;

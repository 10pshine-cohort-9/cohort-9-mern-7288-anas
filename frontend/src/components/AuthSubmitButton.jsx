const AuthSubmitButton = ({ isLoading, loadingText, text }) => {
  return (
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
          {loadingText}
        </span>
      ) : (
        text
      )}
    </button>
  );
};

export default AuthSubmitButton;

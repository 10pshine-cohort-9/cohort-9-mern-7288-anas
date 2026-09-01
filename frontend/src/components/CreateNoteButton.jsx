import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createNote } from "../store/notesSlice.js";

const CreateNoteButton = ({ className = "", text = "New Note" }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isCreating } = useSelector((state) => state.notes);

  const handleCreateNote = async () => {
    try {
      const newNote = await dispatch(
        createNote({ title: "Untitled", content: "" }),
      ).unwrap();

      if (newNote?._id) {
        navigate(`/dashboard/${newNote._id}`);
      }
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCreateNote}
      disabled={isCreating}
      className={`flex items-center justify-center space-x-2 bg-slate-900 text-white font-semibold rounded-full shadow-md shadow-slate-900/10 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
    >
      {isCreating ? (
        <>
          <svg
            className="animate-spin w-4 h-4 text-white"
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
          <span>Creating Note...</span>
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>{text}</span>
        </>
      )}
    </button>
  );
};

export default CreateNoteButton;

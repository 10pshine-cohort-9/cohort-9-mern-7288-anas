import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createNote } from '../store/notesSlice.js';

const DashboardIndex = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userData } = useSelector((state) => state.auth);
  const { notes, isCreating } = useSelector((state) => state.notes);

  const displayName =
    userData?.fullName || userData?.username || 'there';

  const handleCreateNote = async () => {
    try {
      const newNote = await dispatch(
        createNote({ title: 'Untitled', content: '' })
      ).unwrap();

      if (newNote?._id) {
        navigate(`/dashboard/${newNote._id}`);
      }
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-12 max-w-3xl mx-auto text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl mb-6 shadow-xs select-none">
        ✍️
      </div>

      {/* Heading */}
      <h1 className="text-3xl font-extrabold tracking-tight text-[#1E1B4B] mb-2">
        Welcome, {displayName}
      </h1>

      {/* Subtitle */}
      <p className="text-sm md:text-base text-slate-500 max-w-md mb-8 leading-relaxed">
        Select a note from the sidebar or create a new one to get started. Capture ideas, organize thoughts, and build your personal workspace.
      </p>

      {/* Deep Slate Pill-shaped Create Button */}
      <button
        onClick={handleCreateNote}
        disabled={isCreating}
        className="inline-flex items-center space-x-2 px-6 py-2.5 text-sm font-semibold rounded-full text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-slate-900/10 transition-all cursor-pointer"
      >
        {isCreating ? (
          <>
            <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Creating Note...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create New Note</span>
          </>
        )}
      </button>

      {/* Recent Notes Grid */}
      {notes && notes.length > 0 && (
        <div className="mt-12 w-full text-left pt-8 border-t border-slate-200/80">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Recent Notes ({notes.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notes.slice(0, 4).map((note) => (
              <button
                key={note._id}
                onClick={() => navigate(`/dashboard/${note._id}`)}
                className="flex items-start space-x-3 p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 shadow-sm hover:shadow-md text-left transition-all group cursor-pointer"
              >
                <span className="text-xl select-none">📄</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {note.title && note.title.trim() !== '' ? note.title : 'Untitled'}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5 font-normal">
                    {note.content ? note.content.replace(/<[^>]*>?/gm, '').slice(0, 50) : 'Empty note'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardIndex;

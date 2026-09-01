import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import CreateNoteButton from "../components/CreateNoteButton.jsx";

const stripHtmlAndDecode = (htmlString) => {
  if (!htmlString) return "";
  const doc = new DOMParser().parseFromString(htmlString, "text/html");
  return doc.body.textContent || "";
};

const DashboardIndex = () => {
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.auth);
  const { notes } = useSelector((state) => state.notes);

  const displayName = userData?.fullName || userData?.username || "there";

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-12 max-w-3xl mx-auto text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl mb-6 shadow-xs select-none">
        ✍️
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-[#1E1B4B] mb-2">
        Welcome, {displayName}
      </h1>

      <p className="text-sm md:text-base text-slate-500 max-w-md mb-8 leading-relaxed">
        Select a note from the sidebar or create a new one to get started.
        Capture ideas, organize thoughts, and build your personal workspace.
      </p>

      <CreateNoteButton
        className="inline-flex px-6 py-2.5 text-sm"
        text="Create New Note"
      />

      {notes && notes.length > 0 && (
        <div className="mt-12 w-full text-left pt-8 border-t border-slate-200/80">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Recent Notes ({notes.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notes.slice(0, 4).map((note) => (
              <button
                type="button"
                key={note._id}
                onClick={() => navigate(`/dashboard/${note._id}`)}
                className="flex items-start space-x-3 p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 shadow-sm hover:shadow-md text-left transition-all group cursor-pointer"
              >
                <span className="text-xl select-none">📄</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {note.title && note.title.trim() !== ""
                      ? note.title
                      : "Untitled"}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5 font-normal">
                    {note.content
                      ? stripHtmlAndDecode(note.content).slice(0, 60)
                      : "Empty note"}
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

import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotes, createNote, deleteNote } from "../store/notesSlice.js";
import { logout } from "../store/authSlice.js";
import { axiosInstance } from "../api/axios.js";

const DashboardLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { noteId } = useParams();

  const { userData } = useSelector((state) => state.auth);
  const { notes, isLoading, isCreating } = useSelector((state) => state.notes);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    dispatch(fetchNotes());
  }, [dispatch]);

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

  const handleDeleteNote = async (e, idToDelete) => {
    e.stopPropagation();
    e.preventDefault();

    const isConfirmed = window.confirm(
      "Are you sure you want to delete this note? This action cannot be undone.",
    );
    if (!isConfirmed) {
      return;
    }

    try {
      await dispatch(deleteNote(idToDelete)).unwrap();
      if (noteId === idToDelete) {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await axiosInstance.post("/users/logout");
    } catch (err) {
      console.error("Logout error on server:", err);
    } finally {
      dispatch(logout());
      window.location.href = "/";
    }
  };

  const filteredNotes = notes.filter((note) =>
    (note.title || "Untitled")
      .toLowerCase()
      .includes(searchQuery.toLowerCase().trim()),
  );

  const displayName =
    userData?.fullName || userData?.username || userData?.email || "User";

  const userInitial = displayName.charAt(0).toUpperCase();

  const activeNote = notes.find((n) => n._id === noteId);

  let currentTitle = "Workspace";
  if (activeNote?.title?.trim()) {
    currentTitle = activeNote.title;
  } else if (noteId) {
    currentTitle = "Untitled";
  }
  const renderNotesContent = () => {
    if (isLoading && notes.length === 0) {
      return (
        <li className="list-none space-y-2 p-2">
          <div className="h-9 bg-slate-200/60 rounded-lg animate-pulse" />
          <div className="h-9 bg-slate-200/60 rounded-lg animate-pulse" />
          <div className="h-9 bg-slate-200/60 rounded-lg animate-pulse" />
        </li>
      );
    }

    if (filteredNotes.length === 0) {
      return (
        <li className="list-none px-4 py-8 text-center text-xs text-slate-400 font-medium">
          {searchQuery
            ? "No notes match your search."
            : 'No notes yet. Click "+ New Note" to start!'}
        </li>
      );
    }

    return filteredNotes.map((note) => {
      const isActive = noteId === note._id;

      let noteTitle = "Untitled";
      if (note.title?.trim()) {
        noteTitle = note.title;
      }

      return (
        <li
          key={note._id}
          className={`group relative flex items-center justify-between rounded-lg text-sm transition-colors cursor-pointer ${
            isActive
              ? "bg-indigo-50 text-slate-900 font-semibold px-3 py-2"
              : "text-slate-600 hover:bg-slate-200/50 rounded-lg px-3 py-2"
          }`}
        >
          <NavLink
            to={`/dashboard/${note._id}`}
            className="flex items-center space-x-2.5 min-w-0 flex-1 py-0.5 focus:outline-none"
          >
            <svg
              className={`w-4 h-4 shrink-0 ${
                isActive
                  ? "text-indigo-600"
                  : "text-slate-400 group-hover:text-slate-600"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="truncate">{noteTitle}</span>
          </NavLink>

          <button
            type="button"
            onClick={(e) => handleDeleteNote(e, note._id)}
            aria-label={`Delete note: ${noteTitle}`}
            title={`Delete note: ${noteTitle}`}
            className="ml-2 p-1 rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-100 text-slate-400 hover:text-red-600 transition-all cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </li>
      );
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {isSidebarOpen && (
        <div
          role="button"
          tabIndex={0}
          className="fixed inset-0 z-20 bg-slate-900/30 backdrop-blur-xs md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsSidebarOpen(false);
            }
          }}
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200 bg-slate-50 transition-all duration-200 ease-in-out shrink-0 ${
          isSidebarOpen
            ? "w-80 translate-x-0"
            : "-translate-x-full md:w-0 md:translate-x-0 md:border-none"
        }`}
      >
        {isSidebarOpen && (
          <div className="flex flex-col h-full w-80">
            <div className="p-6 flex flex-col space-y-5 border-b border-slate-200/80">
              <div className="flex items-center justify-between">
                <NavLink to="/" className="flex items-center space-x-2 group">
                  <span className="text-xl group-hover:scale-110 transition-transform">
                    ⚡
                  </span>
                  <span className="font-extrabold text-xl tracking-tight text-slate-900">
                    NotesFlow
                  </span>
                </NavLink>

                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  title="Collapse sidebar"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCreateNote}
                disabled={isCreating}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-900 text-white rounded-full font-semibold text-sm shadow-md shadow-slate-900/10 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                    <span>New Note</span>
                  </>
                )}
              </button>
            </div>

            <div className="px-6 pt-4 pb-2">
              <div className="relative flex items-center">
                <svg
                  className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>All Notes</span>
              <span className="bg-slate-200/70 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                {filteredNotes.length}
              </span>
            </div>

            <ul className="flex-1 overflow-y-auto px-4 py-2 space-y-1 list-none m-0 scrollbar-thin">
              {renderNotesContent()}
            </ul>

            <div className="p-4 border-t border-slate-200/80 bg-slate-100/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                    {userInitial}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-1.5">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {displayName}
                      </p>
                      {userData?.subscriptionPlan &&
                        userData.subscriptionPlan !== "Starter" && (
                          <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm ml-2 shrink-0">
                            {userData.subscriptionPlan}
                          </span>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {userData?.email || ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  title="Sign out"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                title="Expand sidebar"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}

            <nav className="flex items-center space-x-2 text-sm text-slate-400 font-medium">
              <NavLink
                to="/dashboard"
                className="hover:text-slate-700 transition-colors"
              >
                Workspace
              </NavLink>
              <span>/</span>
              <span className="text-slate-900 font-semibold truncate max-w-[240px]">
                {currentTitle}
              </span>
            </nav>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

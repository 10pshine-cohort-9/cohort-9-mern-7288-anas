import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotes, createNote, deleteNote } from '../store/notesSlice.js';
import { logout } from '../store/authSlice.js';
import { axiosInstance } from '../api/axios.js';

const DashboardLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { noteId } = useParams();

  const { userData } = useSelector((state) => state.auth);
  const { notes, isLoading, isCreating } = useSelector((state) => state.notes);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    dispatch(fetchNotes());
  }, [dispatch]);

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

  const handleDeleteNote = async (e, idToDelete) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      await dispatch(deleteNote(idToDelete)).unwrap();
      if (noteId === idToDelete) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await axiosInstance.post('/users/logout');
    } catch (err) {
      console.error('Logout error on server:', err);
    } finally {
      dispatch(logout());
      navigate('/login');
      setIsLoggingOut(false);
    }
  };

  const filteredNotes = notes.filter((note) =>
    (note.title || 'Untitled')
      .toLowerCase()
      .includes(searchQuery.toLowerCase().trim())
  );

  const displayName =
    userData?.fullName || userData?.username || userData?.email || 'User';

  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-[#f7f6f3] dark:bg-zinc-900 transition-all duration-200 ease-in-out ${
          isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:w-0 md:translate-x-0 md:border-none'
        }`}
      >
        {isSidebarOpen && (
          <div className="flex flex-col h-full w-64">
            {/* Top Workspace Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {userInitial}
                </div>
                <div className="truncate">
                  <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {displayName}&apos;s Notes
                  </h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    Personal Workspace
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                title="Collapse sidebar"
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* Quick Action Button: New Note */}
            <div className="px-3 pt-3 pb-2">
              <button
                onClick={handleCreateNote}
                disabled={isCreating}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 hover:bg-zinc-50 dark:hover:bg-zinc-750 hover:shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed group shadow-2xs"
              >
                <span className="flex items-center space-x-2">
                  {isCreating ? (
                    <svg className="animate-spin w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  <span>New Note</span>
                </span>
                <span className="text-[10px] text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5">
                  + Draft
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="px-3 pb-2">
              <div className="relative">
                <svg
                  className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-zinc-200/50 dark:bg-zinc-800/60 border-none text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                />
              </div>
            </div>

            {/* Notes List Header */}
            <div className="px-3 pt-2 pb-1 flex items-center justify-between text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              <span>Notes</span>
              <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.2 rounded text-[10px]">
                {notes.length}
              </span>
            </div>

            {/* Scrollable Notes List */}
            <ul className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 scrollbar-thin list-none m-0 p-0">
              {isLoading && notes.length === 0 ? (
                <li className="list-none space-y-2 p-2">
                  <div className="h-7 bg-zinc-200/70 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="h-7 bg-zinc-200/70 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="h-7 bg-zinc-200/70 dark:bg-zinc-800 rounded animate-pulse" />
                </li>
              ) : filteredNotes.length === 0 ? (
                <li className="list-none px-3 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
                  {searchQuery ? 'No notes match your search.' : 'No notes yet. Click "+ New Note" to start!'}
                </li>
              ) : (
                filteredNotes.map((note) => {
                  const isActive = noteId === note._id;
                  const noteTitle =
                    note.title && note.title.trim() !== '' ? note.title : 'Untitled';
                  return (
                    <li
                      key={note._id}
                      className={`group relative flex items-center justify-between rounded-md text-xs transition-all ${
                        isActive
                          ? 'bg-zinc-200/90 dark:bg-zinc-800 font-medium text-zinc-900 dark:text-zinc-100 shadow-2xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      <NavLink
                        to={`/dashboard/${note._id}`}
                        className="flex items-center space-x-2 min-w-0 flex-1 px-2.5 py-1.5 pr-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-l-md"
                      >
                        <svg
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
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

                      {/* Sibling Delete Action Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNote(e, note._id)}
                        aria-label={`Delete note: ${noteTitle}`}
                        title={`Delete note: ${noteTitle}`}
                        className="mr-1.5 p-1 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                })
              )}
            </ul>

            {/* Bottom User Profile and Logout */}
            <div className="p-3 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-100/60 dark:bg-zinc-900/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-full bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center text-xs font-semibold shrink-0">
                    {userInitial}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      {displayName}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {userData?.email || ''}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  title="Sign out"
                  className="p-1.5 rounded-md text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-zinc-950">
        {/* Top Minimal Navigation Bar */}
        <header className="h-12 border-b border-zinc-100 dark:border-zinc-800/80 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                title="Expand sidebar"
                className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <nav className="flex items-center space-x-1.5 text-xs text-zinc-400">
              <NavLink to="/dashboard" className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                Dashboard
              </NavLink>
              {noteId && (
                <>
                  <span>/</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate max-w-[200px]">
                    {notes.find((n) => n._id === noteId)?.title || 'Note Editor'}
                  </span>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateNote}
              disabled={isCreating}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-md text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>New</span>
            </button>
          </div>
        </header>

        {/* Dynamic Nested Content via Outlet */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

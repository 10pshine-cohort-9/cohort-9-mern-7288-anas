import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Home = () => {
  const { status: isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="relative isolate min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500 selection:text-white flex flex-col font-sans">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -left-48 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-2/3 -right-48 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-zinc-950/80 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <span className="font-bold text-lg tracking-tight text-white group-hover:text-indigo-300 transition-colors">
              NotesFlow
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-zinc-100 transition-colors">
              Features
            </a>
            <a href="#preview" className="hover:text-zinc-100 transition-colors">
              Workspace
            </a>
            <a href="#security" className="hover:text-zinc-100 transition-colors">
              Security
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Go to Dashboard</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
          {/* Release Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-medium mb-8 backdrop-blur-sm shadow-inner">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>Notion-style Editor • Powered by React & Cloudinary</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] max-w-4xl mx-auto">
            Your Mind, Organized.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400">
              Capture ideas at the speed of thought.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Experience a seamless, distraction-free workspace. Write rich text with effortless formatting, upload inline images to the cloud, and enjoy real-time auto-saving.
          </p>

          {/* Call to Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 text-base font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{isAuthenticated ? 'Open Dashboard' : "Get Started - It's Free"}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-xl text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 hover:text-white border border-zinc-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isAuthenticated ? 'View My Notes' : 'Log In'}
            </Link>
          </div>

          {/* Micro-Features Row */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs text-zinc-400">
            <div className="flex items-center space-x-1.5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Instant Auto-Save</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Cloudinary Cloud Media</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>JWT Authentication</span>
            </div>
          </div>
        </section>

        {/* Product Workspace Mockup */}
        <section id="preview" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-24">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-2 sm:p-3 shadow-2xl backdrop-blur-xl shadow-indigo-950/20">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950 overflow-hidden">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800/80">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-xs font-mono text-zinc-500">notesflow.app/dashboard</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Saved</span>
                </div>
              </div>

              {/* Editor Workspace Demo UI */}
              <div className="p-6 sm:p-10 text-left">
                {/* Simulated Note Header */}
                <div className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-6">
                  🚀 Launch Roadmap & Product Architecture
                </div>

                {/* Simulated Content */}
                <div className="space-y-4 text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
                  <p>
                    Building high-performance note systems requires resilient client-server synchronization, instant search, and seamless media ingestion.
                  </p>

                  {/* Highlights Box */}
                  <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-200">
                    <span className="font-semibold text-indigo-400">Key Objective:</span> Empower creators to organize thoughts without UI friction, latency, or data loss.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/60 flex items-start space-x-3">
                      <span className="text-lg">✨</span>
                      <div>
                        <div className="text-xs font-semibold text-white">Full-Text Quill Integration</div>
                        <div className="text-xs text-zinc-400 mt-0.5">Rich headers, lists, code syntax, and inline embeds.</div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/60 flex items-start space-x-3">
                      <span className="text-lg">☁️</span>
                      <div>
                        <div className="text-xs font-semibold text-white">Automatic Asset Garbage Collection</div>
                        <div className="text-xs text-zinc-400 mt-0.5">Cloudinary deletes orphaned images on backspace.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Showcase Section */}
        <section id="features" className="py-20 bg-zinc-900/40 border-y border-zinc-800/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">
                Engineered for Productivity
              </h2>
              <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Everything you need to capture and organize thoughts
              </h3>
              <p className="mt-4 text-zinc-400 text-sm sm:text-base">
                Modern tools shouldn’t get in your way. NotesFlow combines simplicity with powerful MERN architecture.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 hover:border-indigo-500/40 hover:bg-zinc-900/40 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                  ✍️
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Rich Text Editing</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Notion-style interface powered by React Quill. Headers, bullet lists, code syntax, quotes, and clean formatting.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 hover:border-indigo-500/40 hover:bg-zinc-900/40 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                  ☁️
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Cloud Integration</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Seamless inline image uploads powered by Cloudinary with automatic cleanup when images are removed.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 hover:border-indigo-500/40 hover:bg-zinc-900/40 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Smart Auto-Save</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Never lose a thought. Debounced background auto-save and atomic revision tracking protect your work in real-time.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 hover:border-indigo-500/40 hover:bg-zinc-900/40 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                  🔒
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Secure & Private</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Robust JWT authentication, secure session persistence, and scoped ownership keep your notes safe.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Privacy Section */}
        <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-8 sm:p-12 backdrop-blur-xl">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">
                Security & Privacy
              </h2>
              <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Built to protect your data at every layer
              </h3>
              <p className="mt-4 text-zinc-400 text-sm sm:text-base">
                Your notes and media assets belong strictly to you. NotesFlow ensures end-to-end access control and zero data loss.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/80">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl mb-4">
                  🔑
                </div>
                <h4 className="text-base font-semibold text-white mb-2">JWT Authentication</h4>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Stateless token authentication with HTTP-only cookies and robust session validation.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/80">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xl mb-4">
                  🛡️
                </div>
                <h4 className="text-base font-semibold text-white mb-2">User Scoped Access</h4>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Strict database query boundaries ensure only authenticated owners can access or edit their notes.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/80">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl mb-4">
                  💾
                </div>
                <h4 className="text-base font-semibold text-white mb-2">Resilient Auto-Save</h4>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Atomic revision control, debounced background saves, and unmount flushing protect against data loss.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="relative rounded-3xl overflow-hidden p-8 sm:p-14 border border-indigo-500/30 bg-gradient-to-b from-indigo-950/50 to-zinc-900/90 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 pointer-events-none" />
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white relative z-10">
              Ready to supercharge your notes?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-xl mx-auto relative z-10">
              Join today and enjoy a clean, fast, and secure workspace for all your ideas and projects.
            </p>

            <div className="mt-8 flex justify-center relative z-10">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="inline-flex items-center space-x-2 px-8 py-4 text-base font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{isAuthenticated ? 'Go to My Dashboard' : 'Get Started for Free'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-zinc-300">NotesFlow</span>
            <span>•</span>
            <span>MERN Stack Notion Clone</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link to="/login" className="hover:text-zinc-300 transition-colors">
              Log In
            </Link>
            <Link to="/register" className="hover:text-zinc-300 transition-colors">
              Register
            </Link>
            <Link to="/dashboard" className="hover:text-zinc-300 transition-colors">
              Dashboard
            </Link>
          </div>

          <div>
            &copy; {new Date().getFullYear()} NotesFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

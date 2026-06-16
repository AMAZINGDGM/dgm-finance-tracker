export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#030712]">
      <div className="auth-grid-motion fixed inset-0 opacity-70" aria-hidden="true" />
      <div className="auth-light-ribbon fixed inset-0" aria-hidden="true" />
      <div className="auth-particle-field fixed inset-0" aria-hidden="true" />
      <div className="auth-ambient-blob auth-blob-one" aria-hidden="true" />
      <div className="auth-ambient-blob auth-blob-two" aria-hidden="true" />
      <div className="auth-ambient-blob auth-blob-three" aria-hidden="true" />
      <div
        className="fixed left-1/2 top-0 h-px w-[80vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent shadow-[0_0_36px_rgba(34,211,238,0.55)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}

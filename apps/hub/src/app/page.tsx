export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="glass-panel p-12 max-w-4xl w-full text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-demiurge-cyan via-demiurge-violet to-demiurge-gold bg-clip-text text-transparent">
          DEMIURGE.CLOUD
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          The Metaverse Operating System
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/portal"
            className="glass-panel px-8 py-4 rounded-lg hover:chroma-glow transition-all"
          >
            Enter Portal
          </a>
          <a
            href="/login"
            className="glass-panel px-8 py-4 rounded-lg hover:chroma-glow transition-all"
          >
            Login
          </a>
        </div>
      </div>
    </main>
  )
}

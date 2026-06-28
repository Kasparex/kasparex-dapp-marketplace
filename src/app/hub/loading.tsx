export default function HubLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      <div className="h-16 border-b border-zinc-200 dark:border-zinc-800" />
      <main className="flex-1 animate-pulse">
        <div className="border-b border-zinc-200 px-4 py-16 dark:border-zinc-800 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-4 text-center">
            <div className="mx-auto h-6 w-40 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="mx-auto h-12 w-full max-w-lg rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="mx-auto h-20 w-full max-w-2xl rounded-lg bg-zinc-100 dark:bg-zinc-900" />
          </div>
        </div>
        <div className="container mx-auto grid grid-cols-1 gap-6 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
          ))}
        </div>
      </main>
    </div>
  );
}

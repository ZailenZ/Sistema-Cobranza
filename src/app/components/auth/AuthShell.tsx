interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.03),transparent_32%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background)))]">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

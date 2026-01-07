import Sidebar from "../components/Sidebar"; // Adjust path if needed

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      
      {/* 1. SIDEBAR (Fixed Width) */}
      <aside className="w-64 flex-shrink-0 hidden md:block">
        <Sidebar />
      </aside>

      {/* 2. MAIN CONTENT (Scrollable) */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {/* Mobile Header Trigger could go here */}
        <div className="w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}
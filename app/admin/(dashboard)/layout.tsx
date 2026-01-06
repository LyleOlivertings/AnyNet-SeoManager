import AuthProvider from "@/app/providers"; // Import it here too

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {" "}
      {/* Force wrap the admin section */}
      <div className="admin-container">{children}</div>
    </AuthProvider>
  );
}

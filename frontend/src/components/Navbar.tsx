import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  if (!user) return null;
  const isAdmin = user.role === "admin";
  const patientLinks = [
    { href: "/dashboard", label: "Records" },
    { href: "/medicines", label: "Medicines" },
    { href: "/timeline", label: "Timeline" },
    { href: "/profile", label: "Profile" },
  ];
  const adminLinks = [
    { href: "/admin", label: "Patients" },
    { href: "/admin/upload", label: "Upload record" },
  ];
  const links = isAdmin ? adminLinks : patientLinks;
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M9 12h6M12 9v6M5.5 20H4a2 2 0 01-2-2V6a2 2 0 012-2h5.5"/>
              <path d="M14.5 4H20a2 2 0 012 2v12a2 2 0 01-2 2h-1.5"/>
              <rect x="8" y="2" width="8" height="4" rx="1"/>
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-sm hidden sm:block">MediTrack</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link key={link.href} href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                router.pathname === link.href
                  ? "bg-teal-50 text-teal-700 font-medium"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden lg:block max-w-[120px] truncate">{user.full_name}</span>
          <button onClick={logout} className="btn-outline text-xs px-3 py-1.5 flex-shrink-0">Logout</button>
        </div>
      </div>
    </header>
  );
}

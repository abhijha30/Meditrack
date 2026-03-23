import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { patientAPI } from "@/lib/api";
import Head from "next/head";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user?.role === "patient") router.push("/dashboard");
  }, [user, loading]);

  const searchPatients = async (q: string) => {
    setFetching(true);
    try {
      const res = await patientAPI.search(q);
      setPatients(res.data);
    } catch {
      toast.error("Search failed");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      const timer = setTimeout(() => searchPatients(search), 400);
      return () => clearTimeout(timer);
    }
  }, [search, user]);

  if (loading) return <Loading />;
  if (!user) return null;

  return (
    <>
      <Head><title>Admin — MediTrack</title></Head>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M9 12h6M12 9v6M5.5 20H4a2 2 0 01-2-2V6a2 2 0 012-2h5.5"/>
                  <path d="M14.5 4H20a2 2 0 012 2v12a2 2 0 01-2 2h-1.5"/>
                  <rect x="8" y="2" width="8" height="4" rx="1"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">MediTrack Admin</p>
                <p className="text-xs text-gray-400">{user.hospital_name || user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push("/admin/upload")} className="btn-primary text-xs">
                + Upload record
              </button>
              <button onClick={logout} className="btn-outline text-xs px-3 py-1.5">Logout</button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Patient records</h2>
            <p className="text-sm text-gray-500">Search and manage patient health records</p>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              className="input pl-9"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Patient list */}
          <div className="card !p-0 overflow-hidden">
            {fetching ? (
              <div className="p-8 text-center text-sm text-gray-400">Searching...</div>
            ) : patients.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                {search ? "No patients found" : "Type to search patients"}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {patients.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-semibold text-sm flex-shrink-0">
                      {p.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{p.email} {p.phone && `· ${p.phone}`}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => router.push(`/admin/patient/${p.id}`)}
                        className="btn-outline text-xs px-3 py-1.5"
                      >
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/admin/upload?email=${encodeURIComponent(p.email)}`)}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        Upload
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

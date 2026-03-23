import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { visitsAPI, reportsAPI } from "@/lib/api";
import Head from "next/head";
import { format } from "date-fns";
import toast from "react-hot-toast";

const badgeClass: Record<string, string> = {
  completed: "bg-teal-50 text-teal-700",
  scheduled: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  normal: "bg-teal-50 text-teal-700",
  abnormal: "bg-red-50 text-red-700",
  pending: "bg-amber-50 text-amber-700",
};

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [visits, setVisits] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user?.role === "admin") router.push("/admin");
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    Promise.all([visitsAPI.myVisits(), reportsAPI.myReports()])
      .then(([v, r]) => {
        setVisits(v.data);
        setReports(r.data);
      })
      .catch(() => toast.error("Failed to load records"))
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || fetching) return <LoadingScreen />;
  if (!user) return null;

  const activeMeds = visits.flatMap((v: any) => v.medicines?.filter((m: any) => m.is_active) || []);

  return (
    <>
      <Head><title>Dashboard — MediTrack</title></Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M9 12h6M12 9v6M5.5 20H4a2 2 0 01-2-2V6a2 2 0 012-2h5.5"/>
                  <path d="M14.5 4H20a2 2 0 012 2v12a2 2 0 01-2 2h-1.5"/>
                  <rect x="8" y="2" width="8" height="4" rx="1"/>
                </svg>
              </div>
              <span className="font-semibold text-gray-900">MediTrack</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <button onClick={logout} className="btn-outline text-xs px-3 py-1.5">Logout</button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Welcome */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Welcome, {user.full_name.split(" ")[0]}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Here's your complete health record</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total visits", value: visits.length },
              { label: "Active medicines", value: activeMeds.length },
              { label: "Reports", value: reports.length },
              { label: "Doctors seen", value: new Set(visits.map((v: any) => v.doctor_name)).size },
            ].map((s) => (
              <div key={s.label} className="card !p-4">
                <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Active Medicines */}
          {activeMeds.length > 0 && (
            <div className="card">
              <h3 className="font-medium text-gray-900 mb-4">Active medicines</h3>
              <div className="space-y-3">
                {activeMeds.map((med: any) => (
                  <div key={med.id} className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-teal-700" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2h-4M9 3a2 2 0 002 2h2a2 2 0 002-2M9 3a2 2 0 012-2h2a2 2 0 012 2"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{med.name}</p>
                      <p className="text-xs text-gray-500">{med.dosage}</p>
                      {med.duration && <p className="text-xs text-teal-600 mt-0.5">{med.duration}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visit History */}
          <div className="card">
            <h3 className="font-medium text-gray-900 mb-4">Visit history</h3>
            {visits.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No visits recorded yet</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {visits.map((visit: any) => (
                  <div key={visit.id} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900">{visit.doctor_name}</p>
                          <span className={`badge ${badgeClass[visit.status] || "bg-gray-100 text-gray-600"}`}>
                            {visit.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {visit.hospital_name} · {visit.department}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(visit.visit_date), "dd MMM yyyy")}
                        </p>
                        {visit.diagnosis && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="text-gray-400">Diagnosis:</span> {visit.diagnosis}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}
                        className="text-xs text-teal-600 hover:text-teal-800 whitespace-nowrap"
                      >
                        {expandedVisit === visit.id ? "Hide ↑" : "Details ↓"}
                      </button>
                    </div>

                    {expandedVisit === visit.id && (
                      <div className="mt-4 space-y-3 bg-gray-50 rounded-lg p-4">
                        {visit.doctor_notes && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Doctor's notes</p>
                            <p className="text-sm text-gray-700">{visit.doctor_notes}</p>
                          </div>
                        )}
                        {visit.medicines?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Medicines prescribed</p>
                            <div className="space-y-2">
                              {visit.medicines.map((m: any) => (
                                <div key={m.id} className="flex justify-between text-sm">
                                  <span className="font-medium text-gray-800">{m.name}</span>
                                  <span className="text-gray-500">{m.dosage}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {visit.follow_up_date && (
                          <p className="text-xs text-amber-600">
                            Follow-up: {format(new Date(visit.follow_up_date), "dd MMM yyyy")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reports */}
          {reports.length > 0 && (
            <div className="card">
              <h3 className="font-medium text-gray-900 mb-4">Lab reports & documents</h3>
              <div className="space-y-3">
                {reports.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.title}</p>
                      <p className="text-xs text-gray-400">
                        {r.lab_name} · {r.report_date ? format(new Date(r.report_date), "dd MMM yyyy") : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${badgeClass[r.status] || "bg-gray-100 text-gray-600"}`}>{r.status}</span>
                      {r.file_url && (
                        <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline">
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading your records...</p>
      </div>
    </div>
  );
}

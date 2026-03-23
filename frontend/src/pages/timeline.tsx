import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { visitsAPI, reportsAPI } from "@/lib/api";
import Head from "next/head";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import { format } from "date-fns";
import toast from "react-hot-toast";

const deptColor: Record<string, string> = {
  "General Medicine": "bg-blue-50 text-blue-700",
  "Cardiology": "bg-red-50 text-red-700",
  "Orthopedics": "bg-amber-50 text-amber-700",
  "Dermatology": "bg-pink-50 text-pink-700",
  "Neurology": "bg-purple-50 text-purple-700",
  "ENT": "bg-teal-50 text-teal-700",
  "Pediatrics": "bg-green-50 text-green-700",
  "Dentistry": "bg-orange-50 text-orange-700",
};

export default function TimelinePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [visits, setVisits] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    Promise.all([visitsAPI.myVisits(), reportsAPI.myReports()])
      .then(([v, r]) => { setVisits(v.data); setReports(r.data); })
      .catch(() => toast.error("Failed to load timeline"))
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || fetching) return <Spinner message="Building your timeline..." />;
  if (!user) return null;

  return (
    <>
      <Head><title>Health Timeline — MediTrack</title></Head>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Health timeline</h2>
            <p className="text-sm text-gray-500">{visits.length} visits · {reports.length} reports</p>
          </div>

          {visits.length === 0 ? (
            <div className="card text-center py-12 text-sm text-gray-400">No records yet</div>
          ) : (
            <div className="relative pl-6">
              {/* Vertical line */}
              <div className="absolute left-2 top-2 bottom-0 w-px bg-gray-200" />

              <div className="space-y-6">
                {visits.map((visit: any) => {
                  const visitReports = reports.filter((r: any) => r.visit_id === visit.id);
                  const isOpen = expanded === visit.id;
                  return (
                    <div key={visit.id} className="relative">
                      {/* Dot */}
                      <div className="absolute -left-6 top-4 w-3 h-3 rounded-full bg-teal-500 border-2 border-white ring-1 ring-teal-200" />

                      <div className="card hover:border-teal-200 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-gray-900 text-sm">{visit.doctor_name}</p>
                              {visit.department && (
                                <span className={`badge text-xs ${deptColor[visit.department] || "bg-gray-100 text-gray-600"}`}>
                                  {visit.department}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{visit.hospital_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {visit.visit_date ? format(new Date(visit.visit_date), "dd MMMM yyyy") : ""}
                            </p>
                            {visit.diagnosis && (
                              <p className="text-sm text-gray-700 mt-1">
                                <span className="text-gray-400 text-xs">Diagnosis: </span>
                                {visit.diagnosis}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => setExpanded(isOpen ? null : visit.id)}
                            className="text-xs text-teal-600 hover:text-teal-800 whitespace-nowrap mt-1"
                          >
                            {isOpen ? "Close ↑" : "Details ↓"}
                          </button>
                        </div>

                        {isOpen && (
                          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                            {/* Doctor notes */}
                            {visit.doctor_notes && (
                              <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Doctor's notes</p>
                                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{visit.doctor_notes}</p>
                              </div>
                            )}

                            {/* Medicines */}
                            {visit.medicines?.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Medicines prescribed</p>
                                <div className="space-y-2">
                                  {visit.medicines.map((m: any) => (
                                    <div key={m.id} className="flex items-start justify-between gap-2 text-sm p-2 bg-teal-50 rounded-lg">
                                      <div>
                                        <span className="font-medium text-gray-800">{m.name}</span>
                                        {m.instructions && <span className="text-xs text-gray-500 ml-2">({m.instructions})</span>}
                                      </div>
                                      <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                                        <div>{m.dosage}</div>
                                        {m.duration && <div className="text-teal-600">{m.duration}</div>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Reports */}
                            {visitReports.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Reports</p>
                                <div className="space-y-1">
                                  {visitReports.map((r: any) => (
                                    <div key={r.id} className="flex items-center justify-between text-sm p-2 bg-amber-50 rounded-lg">
                                      <span className="text-gray-700">{r.title}</span>
                                      {r.file_url && (
                                        <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                                          className="text-xs text-teal-600 hover:underline">
                                          Download
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Follow-up */}
                            {visit.follow_up_date && (
                              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                                Follow-up scheduled: {format(new Date(visit.follow_up_date), "dd MMM yyyy")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

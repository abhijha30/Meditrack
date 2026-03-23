import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { patientAPI } from "@/lib/api";
import Head from "next/head";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function PatientDetail() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [summary, setSummary] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user?.role !== "admin") router.push("/dashboard");
  }, [user, loading]);

  useEffect(() => {
    if (id && user?.role === "admin") {
      patientAPI.getSummary(id as string)
        .then((res) => setSummary(res.data))
        .catch(() => toast.error("Failed to load patient"))
        .finally(() => setFetching(false));
    }
  }, [id, user]);

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!summary) return null;

  const { profile, total_visits, active_medicines, reports, latest_exercise_plan } = summary;

  return (
    <>
      <Head><title>{profile.full_name} — MediTrack Admin</title></Head>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Back
            </button>
            <h1 className="text-sm font-semibold text-gray-900">{profile.full_name}</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
          {/* Profile card */}
          <div className="card flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-xl flex-shrink-0">
              {profile.full_name?.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">{profile.full_name}</h2>
              <p className="text-sm text-gray-500">{profile.email} {profile.phone && `· ${profile.phone}`}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                {profile.date_of_birth && <span>DOB: {format(new Date(profile.date_of_birth), "dd MMM yyyy")}</span>}
                {profile.blood_group && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">{profile.blood_group}</span>}
              </div>
            </div>
            <button
              onClick={() => router.push(`/admin/upload?email=${encodeURIComponent(profile.email)}`)}
              className="btn-primary text-xs"
            >
              + Upload record
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total visits", value: total_visits },
              { label: "Active medicines", value: active_medicines.length },
              { label: "Reports", value: reports.length },
            ].map((s) => (
              <div key={s.label} className="card !p-4">
                <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Active medicines */}
          {active_medicines.length > 0 && (
            <div className="card">
              <h3 className="font-medium text-gray-900 mb-3">Active medicines</h3>
              <div className="divide-y divide-gray-50">
                {active_medicines.map((m: any) => (
                  <div key={m.id} className="py-2 flex justify-between text-sm">
                    <span className="font-medium text-gray-800">{m.name}</span>
                    <span className="text-gray-400">{m.dosage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Latest exercise plan */}
          {latest_exercise_plan && (
            <div className="card">
              <h3 className="font-medium text-gray-900 mb-2">Latest exercise plan</h3>
              <p className="text-sm text-gray-600">{latest_exercise_plan.advice}</p>
              {latest_exercise_plan.restrictions && (
                <p className="text-xs text-amber-600 mt-1">Restrictions: {latest_exercise_plan.restrictions}</p>
              )}
            </div>
          )}

          {/* Reports */}
          {reports.length > 0 && (
            <div className="card">
              <h3 className="font-medium text-gray-900 mb-3">Reports & documents</h3>
              <div className="space-y-2">
                {reports.map((r: any) => (
                  <div key={r.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{r.title}</p>
                      <p className="text-xs text-gray-400">{r.lab_name} {r.report_date && `· ${format(new Date(r.report_date), "dd MMM yyyy")}`}</p>
                    </div>
                    {r.file_url && (
                      <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline">Download</a>
                    )}
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

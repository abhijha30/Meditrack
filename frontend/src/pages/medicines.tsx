import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { visitsAPI } from "@/lib/api";
import Head from "next/head";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function MedicinesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [visits, setVisits] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<"all" | "active">("active");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    visitsAPI.myVisits()
      .then((res) => setVisits(res.data))
      .catch(() => toast.error("Failed to load medicines"))
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || fetching) return <Spinner message="Loading medicines..." />;
  if (!user) return null;

  const allMeds = visits.flatMap((v: any) =>
    (v.medicines || []).map((m: any) => ({
      ...m,
      doctor_name: v.doctor_name,
      hospital_name: v.hospital_name,
      visit_date: v.visit_date,
    }))
  );

  const filtered = filter === "active" ? allMeds.filter((m) => m.is_active) : allMeds;

  return (
    <>
      <Head><title>My Medicines — MediTrack</title></Head>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Medicines</h2>
              <p className="text-sm text-gray-500">All prescriptions across every visit</p>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(["active", "all"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all capitalize ${
                    filter === f ? "bg-white shadow font-medium text-gray-900" : "text-gray-500"
                  }`}>
                  {f === "active" ? "Active" : "All time"}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="card text-center py-10 text-sm text-gray-400">
              {filter === "active" ? "No active medicines right now" : "No medicines recorded yet"}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((med: any) => (
                <div key={med.id} className="card flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    med.is_active ? "bg-teal-50" : "bg-gray-100"
                  }`}>
                    <svg className={`w-5 h-5 ${med.is_active ? "text-teal-600" : "text-gray-400"}`}
                      fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2h-4M9 3a2 2 0 002 2h2a2 2 0 002-2M9 3a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 justify-between">
                      <p className="font-medium text-gray-900 text-sm">{med.name}</p>
                      <span className={`badge text-xs ${med.is_active ? "bg-teal-50 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                        {med.is_active ? "Active" : "Completed"}
                      </span>
                    </div>
                    {med.dosage && <p className="text-sm text-gray-600 mt-0.5">{med.dosage}</p>}
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                      {med.duration && <span>Duration: {med.duration}</span>}
                      {med.instructions && <span>⚠ {med.instructions}</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {med.doctor_name} · {med.hospital_name} · {med.visit_date ? format(new Date(med.visit_date), "dd MMM yyyy") : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

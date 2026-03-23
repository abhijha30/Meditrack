import { useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { visitsAPI, reportsAPI } from "@/lib/api";
import Head from "next/head";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";

interface Medicine {
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
}

export default function UploadRecord() {
  const { user } = useAuth();
  const router = useRouter();
  const prefillEmail = (router.query.email as string) || "";

  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    patient_email: prefillEmail,
    hospital_name: user?.hospital_name || "",
    doctor_name: "",
    department: "",
    visit_date: new Date().toISOString().split("T")[0],
    diagnosis: "",
    doctor_notes: "",
    follow_up_date: "",
    exercise_advice: "",
    exercise_restrictions: "",
  });

  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: "", dosage: "", duration: "", instructions: "" },
  ]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [], "image/*": [] },
  });

  const updateMed = (i: number, field: keyof Medicine, value: string) => {
    setMedicines((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  };

  const addMed = () =>
    setMedicines((prev) => [...prev, { name: "", dosage: "", duration: "", instructions: "" }]);

  const removeMed = (i: number) =>
    setMedicines((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_email || !form.doctor_name || !form.visit_date) {
      toast.error("Please fill in required fields");
      return;
    }
    setSubmitting(true);
    try {
      const validMeds = medicines.filter((m) => m.name.trim());
      const visitPayload: any = {
        patient_email: form.patient_email,
        hospital_name: form.hospital_name,
        doctor_name: form.doctor_name,
        department: form.department,
        visit_date: form.visit_date,
        diagnosis: form.diagnosis,
        doctor_notes: form.doctor_notes,
        follow_up_date: form.follow_up_date || null,
        medicines: validMeds,
      };
      if (form.exercise_advice) {
        visitPayload.exercise_plan = {
          advice: form.exercise_advice,
          restrictions: form.exercise_restrictions,
        };
      }

      await visitsAPI.createVisit(visitPayload);

      // Upload files as reports
      for (const file of files) {
        const fd = new FormData();
        fd.append("patient_email", form.patient_email);
        fd.append("title", file.name.replace(/\.[^/.]+$/, ""));
        fd.append("report_type", file.type.includes("pdf") ? "lab" : "prescription");
        fd.append("file", file);
        await reportsAPI.uploadReport(fd);
      }

      toast.success("Record uploaded successfully!");
      router.push("/admin");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head><title>Upload Record — MediTrack</title></Head>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Back
            </button>
            <h1 className="text-sm font-semibold text-gray-900">Upload patient record</h1>
            <div />
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Patient info */}
            <div className="card">
              <h3 className="font-medium text-gray-900 mb-4">Patient details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Patient email *</label>
                  <input className="input" value={form.patient_email}
                    onChange={(e) => setForm((p) => ({ ...p, patient_email: e.target.value }))}
                    placeholder="patient@example.com" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hospital name</label>
                  <input className="input" value={form.hospital_name}
                    onChange={(e) => setForm((p) => ({ ...p, hospital_name: e.target.value }))}
                    placeholder="City Hospital" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Visit date *</label>
                  <input className="input" type="date" value={form.visit_date}
                    onChange={(e) => setForm((p) => ({ ...p, visit_date: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Doctor name *</label>
                  <input className="input" value={form.doctor_name}
                    onChange={(e) => setForm((p) => ({ ...p, doctor_name: e.target.value }))}
                    placeholder="Dr. Anil Mehta" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Department</label>
                  <select className="input" value={form.department}
                    onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}>
                    <option value="">Select department</option>
                    {["General Medicine","Cardiology","Orthopedics","Dermatology","Neurology","ENT","Pediatrics","Gynecology","Ophthalmology","Dentistry"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Diagnosis</label>
                  <input className="input" value={form.diagnosis}
                    onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))}
                    placeholder="e.g. Viral fever, Type 2 diabetes" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Doctor's notes / advice</label>
                  <textarea className="input min-h-[80px] resize-y" value={form.doctor_notes}
                    onChange={(e) => setForm((p) => ({ ...p, doctor_notes: e.target.value }))}
                    placeholder="Rest for 5 days, avoid cold food..." />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Follow-up date</label>
                  <input className="input" type="date" value={form.follow_up_date}
                    onChange={(e) => setForm((p) => ({ ...p, follow_up_date: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Medicines */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Medicines prescribed</h3>
                <button type="button" onClick={addMed} className="text-xs text-teal-600 hover:text-teal-800">
                  + Add medicine
                </button>
              </div>
              <div className="space-y-4">
                {medicines.map((med, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-gray-500">Medicine {i + 1}</span>
                      {medicines.length > 1 && (
                        <button type="button" onClick={() => removeMed(i)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Name</label>
                        <input className="input" value={med.name} onChange={(e) => updateMed(i, "name", e.target.value)} placeholder="e.g. Dolo 650" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Dosage</label>
                        <input className="input" value={med.dosage} onChange={(e) => updateMed(i, "dosage", e.target.value)} placeholder="1 tab 3x daily after meals" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Duration</label>
                        <input className="input" value={med.duration} onChange={(e) => updateMed(i, "duration", e.target.value)} placeholder="5 days" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Special instructions</label>
                        <input className="input" value={med.instructions} onChange={(e) => updateMed(i, "instructions", e.target.value)} placeholder="Avoid alcohol" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exercise advice */}
            <div className="card">
              <h3 className="font-medium text-gray-900 mb-4">Exercise / lifestyle advice</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Advice</label>
                  <textarea className="input min-h-[70px] resize-y" value={form.exercise_advice}
                    onChange={(e) => setForm((p) => ({ ...p, exercise_advice: e.target.value }))}
                    placeholder="Week 1: 15 min walking. Week 2: add stretching..." />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Restrictions</label>
                  <input className="input" value={form.exercise_restrictions}
                    onChange={(e) => setForm((p) => ({ ...p, exercise_restrictions: e.target.value }))}
                    placeholder="Avoid running for 3 weeks" />
                </div>
              </div>
            </div>

            {/* File upload */}
            <div className="card">
              <h3 className="font-medium text-gray-900 mb-4">Upload files</h3>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-teal-400 bg-teal-50" : "border-gray-200 hover:border-teal-300"
                }`}
              >
                <input {...getInputProps()} />
                <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
                <p className="text-sm text-gray-500">
                  {isDragActive ? "Drop files here" : "Drag & drop or click to upload"}
                </p>
                <p className="text-xs text-gray-400 mt-1">PDFs, images (prescriptions, lab reports, scans)</p>
              </div>
              {files.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-1 bg-teal-50 text-teal-700 text-xs px-3 py-1 rounded-full">
                      <span>{f.name}</span>
                      <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="ml-1 text-teal-500 hover:text-teal-800">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => router.back()} className="btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? "Saving..." : "Save & notify patient"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}

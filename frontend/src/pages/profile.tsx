import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { patientAPI } from "@/lib/api";
import Head from "next/head";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    date_of_birth: "",
    blood_group: "",
  });

  if (!user) { router.push("/login"); return null; }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await patientAPI.updateMe(form);
      toast.success("Profile updated!");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head><title>Profile — MediTrack</title></Head>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Back
            </button>
            <h1 className="text-sm font-semibold text-gray-900">My profile</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="card">
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-2xl">
                {user.full_name?.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user.full_name}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
                <span className="inline-block mt-1 text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Full name</label>
                <input className="input" value={form.full_name} onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mobile number</label>
                <input className="input" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date of birth</label>
                <input className="input" type="date" value={form.date_of_birth} onChange={(e) => setForm(p => ({ ...p, date_of_birth: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Blood group</label>
                <select className="input" value={form.blood_group} onChange={(e) => setForm(p => ({ ...p, blood_group: e.target.value }))}>
                  <option value="">Select blood group</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button type="button" onClick={logout} className="btn-outline text-red-500 border-red-200 hover:bg-red-50">
                  Logout
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}

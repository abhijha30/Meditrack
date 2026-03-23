import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import Head from "next/head";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<"patient" | "admin">("patient");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    hospital_name: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ ...form, role });
      toast.success("Account created!");
      router.push(role === "admin" ? "/admin" : "/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Register — MediTrack</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M9 12h6M12 9v6M5.5 20H4a2 2 0 01-2-2V6a2 2 0 012-2h5.5"/>
                <path d="M14.5 4H20a2 2 0 012 2v12a2 2 0 01-2 2h-1.5"/>
                <rect x="8" y="2" width="8" height="4" rx="1"/>
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Create account</h1>
            <p className="text-gray-500 text-sm mt-1">Join MediTrack today</p>
          </div>

          <div className="card">
            {/* Role toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              {(["patient", "admin"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 text-sm rounded-md transition-all ${
                    role === r ? "bg-white shadow text-gray-900 font-medium" : "text-gray-500"
                  }`}
                >
                  {r === "admin" ? "Hospital Admin" : "Patient"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Full name</label>
                <input className="input" name="full_name" placeholder="Rahul Sharma" value={form.full_name} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email address</label>
                <input className="input" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mobile number</label>
                <input className="input" name="phone" placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} />
              </div>
              {role === "admin" && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hospital name</label>
                  <input className="input" name="hospital_name" placeholder="City Hospital" value={form.hospital_name} onChange={handleChange} required />
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Password</label>
                <input className="input" name="password" type="password" placeholder="Min 8 characters" value={form.password} onChange={handleChange} required minLength={8} />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-5">
              Already have an account?{" "}
              <a href="/login" className="text-teal-600 hover:underline">Sign in</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

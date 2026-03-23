import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import Head from "next/head";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<"patient" | "admin">("patient");
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push(role === "admin" ? "/admin" : "/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Login — MediTrack</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M9 12h6M12 9v6M5.5 20H4a2 2 0 01-2-2V6a2 2 0 012-2h5.5"/>
                <path d="M14.5 4H20a2 2 0 012 2v12a2 2 0 01-2 2h-1.5"/>
                <rect x="8" y="2" width="8" height="4" rx="1"/>
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">MediTrack</h1>
            <p className="text-gray-500 text-sm mt-1">Your health records, always with you</p>
          </div>

          <div className="card">
            {/* Role Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              {(["patient", "admin"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 text-sm rounded-md transition-all capitalize ${
                    role === r ? "bg-white shadow text-gray-900 font-medium" : "text-gray-500"
                  }`}
                >
                  {r === "admin" ? "Hospital Admin" : "Patient"}
                </button>
              ))}
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-4 mb-5 text-sm">
              <button
                onClick={() => setMode("password")}
                className={`pb-1 border-b-2 transition-colors ${mode === "password" ? "border-teal-600 text-teal-600 font-medium" : "border-transparent text-gray-400"}`}
              >
                Email & Password
              </button>
              <button
                onClick={() => setMode("otp")}
                className={`pb-1 border-b-2 transition-colors ${mode === "otp" ? "border-teal-600 text-teal-600 font-medium" : "border-transparent text-gray-400"}`}
              >
                OTP Login
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email address</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {mode === "password" ? (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Password</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <>
                  {!otpSent ? (
                    <button
                      type="button"
                      className="btn-primary w-full"
                      onClick={async () => {
                        if (!email) return toast.error("Enter your email first");
                        try {
                          const { authAPI } = await import("@/lib/api");
                          await authAPI.sendOtp(email);
                          setOtpSent(true);
                          toast.success("OTP sent to your email");
                        } catch {
                          toast.error("Failed to send OTP");
                        }
                      }}
                    >
                      Send OTP
                    </button>
                  ) : (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Enter OTP</label>
                      <input
                        className="input tracking-widest text-center text-lg"
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}

              {(mode === "password" || (mode === "otp" && otpSent)) && (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              )}
            </form>

            <p className="text-center text-xs text-gray-400 mt-5">
              New patient?{" "}
              <a href="/forgot-password" className="text-teal-600 hover:underline mr-3">Forgot password?</a>
              <a href="/register" className="text-teal-600 hover:underline">
                Create account
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

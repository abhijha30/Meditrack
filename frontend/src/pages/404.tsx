import { useRouter } from "next/router";
import Head from "next/head";

export default function NotFound() {
  const router = useRouter();
  return (
    <>
      <Head><title>404 — MediTrack</title></Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-6xl font-bold text-teal-600 mb-4">404</p>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h1>
          <p className="text-gray-500 text-sm mb-6">The page you're looking for doesn't exist.</p>
          <button onClick={() => router.push("/")} className="btn-primary">Go home</button>
        </div>
      </div>
    </>
  );
}

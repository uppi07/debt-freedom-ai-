"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        setError(data?.error || "Login failed");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
      <div className="lg:col-span-3 relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-600 to-blue-600 text-white shadow-2xl p-8">
        <div className="absolute -top-10 -right-10 h-40 w-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-8 h-24 w-24 bg-white/10 rounded-full blur-xl" />
        <div className="relative space-y-4">
          <div className="flex items-center gap-2 text-white/90">
            <span className="text-2xl">⚡</span>
            <span className="text-lg font-semibold">Debt Freedom AI</span>
          </div>
          <h2 className="text-3xl font-bold leading-tight">Welcome back</h2>
          <p className="text-sm text-white/80 max-w-md">
            Sign in to review your payoff timeline, toggle avalanche or snowball, and confirm monthly payments in one place.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-white/85">
            <Badge text="Secure ES256 auth" />
            <Badge text="Live payoff projections" />
            <Badge text="Avalanche & Snowball" />
            <Badge text="Track paid vs pending" />
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="lg:col-span-2 bg-gray-900 p-8 rounded-3xl shadow-xl w-full space-y-4 border border-gray-800"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-100">Sign in</h1>
          <p className="text-sm text-gray-400">Access your dashboard</p>
        </div>
        <label className="flex flex-col gap-1 text-sm text-gray-300">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-gray-700 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="you@example.com"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-300">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-gray-700 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="••••••••"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 text-white py-2.5 font-semibold hover:bg-indigo-700 disabled:opacity-60 transition"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-sm text-gray-600 text-center">
          No account?{" "}
          <a href="/signup" className="text-indigo-600 font-semibold hover:underline">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
      <span className="h-2 w-2 rounded-full bg-white" />
      <span>{text}</span>
    </div>
  );
}

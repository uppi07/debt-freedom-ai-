"use client";

import { useEffect, useState } from "react";

type ProfileData = {
  currency?: string;
  displayCurrency?: string;
  baseCurrency?: string;
  fxRate?: number;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);

  // Load existing profile (read-only view)
  async function loadProfile() {
    const res = await fetch("/api/profile");
    const data = await res.json();
    setProfile(data || {});
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  }, []);

  if (loading) return <p className="text-white px-4 py-8 sm:p-10">Loading...</p>;

  const displayCurrency = profile.displayCurrency || profile.currency || "INR";
  const baseCurrency = profile.baseCurrency || "INR";
  const fxRate = profile.fxRate ?? 1;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 text-white max-w-3xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <div className="bg-gray-900 p-6 rounded-xl space-y-4">
        <p className="text-gray-300 text-sm">
          Currency is controlled in Settings. Update it there and it will be reflected here and across
          the app.
        </p>

        <div className="bg-black/30 p-4 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400">Display Currency</p>
          <p className="text-xl font-semibold">{displayCurrency}</p>
        </div>

        <div className="bg-black/30 p-4 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400">Base Currency (data entry)</p>
          <p className="text-xl font-semibold">{baseCurrency}</p>
        </div>

        <div className="bg-black/30 p-4 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400">
            Conversion Rate (1 {baseCurrency} = ? {displayCurrency})
          </p>
          <p className="text-xl font-semibold">
            {fxRate} {displayCurrency}
          </p>
        </div>

        <p className="text-sm text-gray-400">
          Need to change it? Go to Settings, choose currency and rate, and it will show here.
        </p>
      </div>
    </div>
  );
}

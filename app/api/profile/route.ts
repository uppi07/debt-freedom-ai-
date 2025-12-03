import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Profile from "@/models/Profile";

export async function GET() {
  await connectDB();

  // Return existing profile or create a default one
  let profile = await Profile.findOne();
  if (!profile) {
    profile = await Profile.create({
      salaryDay: 1,
      rentDay: 1,
      currency: "INR",
      baseCurrency: "INR",
      displayCurrency: "INR",
      fxRate: 1,
    });
  } else {
    // Backfill missing fields on existing docs
    let needsSave = false;
    if (!profile.baseCurrency) {
      profile.baseCurrency = "INR";
      needsSave = true;
    }
    if (!profile.displayCurrency) {
      profile.displayCurrency = profile.currency || "INR";
      needsSave = true;
    }
    if (!profile.currency) {
      profile.currency = profile.displayCurrency || "INR";
      needsSave = true;
    }
    if (typeof profile.fxRate !== "number" || Number.isNaN(profile.fxRate)) {
      profile.fxRate = 1;
      needsSave = true;
    }
    if (needsSave) {
      await profile.save();
    }
  }

  return NextResponse.json(profile);
}

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();
  const displayCurrency =
    typeof body.displayCurrency === "string"
      ? body.displayCurrency
      : typeof body.currency === "string"
      ? body.currency
      : "INR";

  const baseCurrency =
    typeof body.baseCurrency === "string" ? body.baseCurrency : "INR";

  const fxRate =
    typeof body.fxRate === "number" && !Number.isNaN(body.fxRate)
      ? body.fxRate
      : Number(body.fxRate) || 1;

  const update = {
    salaryDay: Number(body.salaryDay) || 1,
    rentDay: Number(body.rentDay) || 1,
    currency: displayCurrency,
    baseCurrency,
    displayCurrency,
    fxRate: fxRate || 1,
  };

  const profile = await Profile.findOneAndUpdate({}, update, {
    new: true,
    upsert: true,
  });

  return NextResponse.json(profile);
}

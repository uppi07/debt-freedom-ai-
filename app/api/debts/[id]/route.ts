import { connectDB } from "@/lib/db";
import Debt from "@/models/Debt";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await context.params;

  try {
    const deleted = await Debt.findByIdAndDelete(id);
    return Response.json({ success: true, deleted });
  } catch (err) {
    return Response.json({ success: false, error: err }, { status: 500 });
  }
}

// ⭐ UPDATE ROUTE (PUT)
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await context.params;
  const body = await req.json(); // updated fields

  try {
    const updated = await Debt.findByIdAndUpdate(
      id,
      {
        ...body,
        paymentType: body.paymentType === "one-time" ? "one-time" : "recurring",
      },
      { new: true }
    );

    return Response.json({ success: true, updated });
  } catch (err) {
    return Response.json({ success: false, error: err }, { status: 500 });
  }
}

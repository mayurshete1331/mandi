import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, driverName, vehicleNumber } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (driverName !== undefined) updateData.driverName = driverName;
    if (vehicleNumber !== undefined) updateData.vehicleNumber = vehicleNumber;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        retailer: true,
        wholesaler: true,
        items: {
          include: {
            sku: {
              include: {
                variety: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Order status update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

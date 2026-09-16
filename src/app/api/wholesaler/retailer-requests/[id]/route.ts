import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, creditLimit } = body;

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Valid action (APPROVE or REJECT) is required' }, { status: 400 });
    }

    // Find connection by connection id or retailer id
    let connection = await prisma.wholesalerRetailerConnection.findUnique({
      where: { id },
      include: { retailer: true },
    });

    if (!connection) {
      connection = await prisma.wholesalerRetailerConnection.findFirst({
        where: { retailerId: id },
        include: { retailer: true },
      });
    }

    if (!connection) {
      return NextResponse.json({ error: 'Connection request not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      const assignedLimit = parseFloat(creditLimit ? creditLimit.toString() : '0');
      if (isNaN(assignedLimit) || assignedLimit < 0) {
        return NextResponse.json({ error: 'A valid credit limit amount is required' }, { status: 400 });
      }

      const updated = await prisma.wholesalerRetailerConnection.update({
        where: { id: connection.id },
        data: {
          status: 'ACTIVE',
          creditLimit: assignedLimit,
        },
        include: {
          retailer: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Account for ${updated.retailer.shopName || updated.retailer.name} approved with ₹${assignedLimit.toLocaleString('en-IN')} credit limit!`,
        connection: updated,
      });
    } else {
      const updated = await prisma.wholesalerRetailerConnection.update({
        where: { id: connection.id },
        data: {
          status: 'REJECTED',
        },
        include: {
          retailer: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Registration request for ${updated.retailer.shopName || updated.retailer.name} was rejected.`,
        connection: updated,
      });
    }
  } catch (error: any) {
    console.error('Approval action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId, wholesalerId, amount, reference, notes } = await req.json();

    const payAmount = parseFloat(amount);
    if (!userId || !wholesalerId || isNaN(payAmount) || payAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid user ID, wholesaler ID, and payment amount are required' },
        { status: 400 }
      );
    }

    const connection = await prisma.wholesalerRetailerConnection.findUnique({
      where: {
        wholesalerId_retailerId: {
          wholesalerId,
          retailerId: userId,
        },
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection with this wholesaler not found' },
        { status: 404 }
      );
    }

    const newBalance = Math.max(0, connection.currentBalance - payAmount);

    const [newEntry] = await prisma.$transaction([
      prisma.khataEntry.create({
        data: {
          userId,
          wholesalerId,
          connectionId: connection.id,
          type: 'CREDIT',
          amount: payAmount,
          balanceAfter: newBalance,
          reference: reference || null,
          notes: notes || null,
        },
      }),
      prisma.wholesalerRetailerConnection.update({
        where: { id: connection.id },
        data: { currentBalance: newBalance },
      }),
    ]);

    return NextResponse.json({
      success: true,
      entry: newEntry,
      newBalance,
    });
  } catch (error: any) {
    console.error('Payment record error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

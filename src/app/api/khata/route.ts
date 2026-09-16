import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('mandi_user_id')?.value;
    const queryUserId = searchParams.get('userId');
    const wholesalerId = searchParams.get('wholesalerId');
    const forWholesaler = searchParams.get('all') === 'true';

    // Wholesaler view: returns all connected Kiranas with their specific credit balance and limit
    if (forWholesaler) {
      const sessionUser = sessionUserId
        ? await prisma.user.findUnique({ where: { id: sessionUserId } })
        : null;

      const activeWholesalerId = sessionUser?.role === 'WHOLESALER' ? sessionUser.id : wholesalerId;

      if (!activeWholesalerId) {
        return NextResponse.json({ error: 'Wholesaler ID required' }, { status: 400 });
      }

      const connections = await prisma.wholesalerRetailerConnection.findMany({
        where: {
          wholesalerId: activeWholesalerId,
          status: 'ACTIVE',
        },
        include: {
          retailer: {
            select: {
              id: true,
              name: true,
              shopName: true,
              phoneNumber: true,
              address: true,
            },
          },
          ledger: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      const summary = connections.map((conn) => ({
        id: conn.retailer.id,
        connectionId: conn.id,
        name: conn.retailer.name,
        shopName: conn.retailer.shopName,
        phoneNumber: conn.retailer.phoneNumber,
        address: conn.retailer.address,
        creditLimit: conn.creditLimit,
        outstandingBalance: conn.currentBalance,
        availableCredit: Math.max(0, conn.creditLimit - conn.currentBalance),
        lastTransaction: conn.ledger[0]?.createdAt || null,
      }));

      const totalMarketReceivables = summary.reduce(
        (acc, curr) => acc + curr.outstandingBalance,
        0
      );

      return NextResponse.json({
        summary,
        totalMarketReceivables,
      });
    }

    // Retailer view: single user ledger statement for a specific wholesaler
    const targetUserId = queryUserId || sessionUserId;
    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    let connectionWhere: any = { retailerId: targetUserId, status: 'ACTIVE' };
    if (wholesalerId) {
      connectionWhere.wholesalerId = wholesalerId;
    }

    const connection = await prisma.wholesalerRetailerConnection.findFirst({
      where: connectionWhere,
      include: {
        wholesaler: {
          select: {
            id: true,
            name: true,
            shopName: true,
            phoneNumber: true,
          },
        },
        retailer: {
          select: {
            id: true,
            name: true,
            shopName: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!connection) {
      return NextResponse.json({
        user: null,
        currentBalance: 0,
        availableCredit: 0,
        creditLimit: 0,
        entries: [],
      });
    }

    const entries = await prisma.khataEntry.findMany({
      where: {
        userId: targetUserId,
        wholesalerId: connection.wholesalerId,
      },
      orderBy: { createdAt: 'desc' },
    });

    const availableCredit = Math.max(0, connection.creditLimit - connection.currentBalance);

    return NextResponse.json({
      user: connection.retailer,
      wholesaler: connection.wholesaler,
      creditLimit: connection.creditLimit,
      currentBalance: connection.currentBalance,
      availableCredit,
      entries,
    });
  } catch (error: any) {
    console.error('Khata fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

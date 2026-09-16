import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('mandi_user_id')?.value;

    if (!sessionUserId) {
      return NextResponse.json({ error: 'Unauthorized: Wholesaler session required' }, { status: 401 });
    }

    const wholesaler = await prisma.user.findUnique({
      where: { id: sessionUserId },
    });

    if (!wholesaler || wholesaler.role !== 'WHOLESALER') {
      return NextResponse.json({ error: 'Forbidden: Wholesaler access required' }, { status: 403 });
    }

    // Fetch all retailer connections for this wholesaler
    const connections = await prisma.wholesalerRetailerConnection.findMany({
      where: {
        wholesalerId: wholesaler.id,
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
      },
      orderBy: { createdAt: 'desc' },
    });

    const pending = connections
      .filter((c) => c.status === 'PENDING_APPROVAL')
      .map((c) => ({
        id: c.id,
        retailerId: c.retailer.id,
        name: c.retailer.name,
        shopName: c.retailer.shopName,
        phoneNumber: c.retailer.phoneNumber,
        address: c.retailer.address,
        status: c.status,
        creditLimit: c.creditLimit,
        createdAt: c.createdAt,
      }));

    const active = connections
      .filter((c) => c.status === 'ACTIVE')
      .map((c) => ({
        id: c.id,
        retailerId: c.retailer.id,
        name: c.retailer.name,
        shopName: c.retailer.shopName,
        phoneNumber: c.retailer.phoneNumber,
        address: c.retailer.address,
        status: c.status,
        creditLimit: c.creditLimit,
        currentBalance: c.currentBalance,
        createdAt: c.createdAt,
      }));

    return NextResponse.json({
      wholesaler: { id: wholesaler.id, shopName: wholesaler.shopName, name: wholesaler.name },
      pending,
      active,
    });
  } catch (error: any) {
    console.error('Retailer requests fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

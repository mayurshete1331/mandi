import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('mandi_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        role: true,
        status: true,
        shopName: true,
        address: true,
        wholesalerConnections: {
          select: {
            id: true,
            wholesalerId: true,
            status: true,
            creditLimit: true,
            currentBalance: true,
            wholesaler: {
              select: {
                id: true,
                name: true,
                shopName: true,
                phoneNumber: true,
                address: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

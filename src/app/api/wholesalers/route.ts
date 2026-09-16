import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.toLowerCase() || '';

    const wholesalers = await prisma.user.findMany({
      where: {
        role: 'WHOLESALER',
        status: 'ACTIVE',
        OR: search
          ? [
              { name: { contains: search } },
              { shopName: { contains: search } },
              { address: { contains: search } },
            ]
          : undefined,
      },
      select: {
        id: true,
        name: true,
        shopName: true,
        address: true,
        phoneNumber: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ wholesalers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

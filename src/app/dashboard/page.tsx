import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function DashboardRedirectPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('mandi_user_id')?.value;

  if (!userId) {
    redirect('/login?redirect=/dashboard');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === 'WHOLESALER') {
    redirect('/wholesaler');
  } else if (user?.role === 'KIRANA') {
    redirect('/retailer');
  }

  // If user role is unrecognized or user deleted from DB
  redirect('/login');
}

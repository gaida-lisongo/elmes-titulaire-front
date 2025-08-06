import { EcommerceMetrics } from '@/components/ecommerce/EcommerceMetrics';
import MonthlySalesChart from '@/components/ecommerce/MonthlySalesChart';
import RecentOrders from '@/components/ecommerce/RecentOrders';
import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
  title:
    "Next.js E-commerce Dashboard | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Home for TailAdmin Dashboard Template",
};

export default function Dashboard() {
  return (
    <div>
        <div className="col-span-12 xl:col-span-5">
            <RecentOrders />
        </div>
    </div>
  )
}

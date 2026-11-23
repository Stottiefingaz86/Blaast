import { AdminSkeleton } from "@/components/brand/blaast-preloader";

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <AdminSkeleton />
    </div>
  );
}

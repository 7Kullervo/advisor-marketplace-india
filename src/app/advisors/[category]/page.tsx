import { redirect } from "next/navigation";
export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  redirect(`/advisors?category=${encodeURIComponent((await params).category)}`);
}

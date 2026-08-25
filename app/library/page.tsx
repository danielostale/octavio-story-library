import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Nav } from "@/components/nav";
import { LibraryView } from "@/components/library-view";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  return (
    <>
      <Nav />
      <main className="shell">
        <p className="eyebrow">BIBLIOTECA</p>
        <h1>Los libros de Octavio.</h1>
        <LibraryView />
      </main>
    </>
  );
}

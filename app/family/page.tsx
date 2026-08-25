import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Nav } from "@/components/nav";
import { FamilyEditor } from "@/components/family-editor";

export default async function FamilyPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  return (
    <>
      <Nav />
      <main className="shell narrow">
        <p className="eyebrow">MEMORIA FAMILIAR</p>
        <h1>Quiénes somos.</h1>
        <p className="lead compact">
          Solo se usarán estos datos cuando sean relevantes. La app no debe inventar recuerdos familiares.
        </p>
        <FamilyEditor />
      </main>
    </>
  );
}

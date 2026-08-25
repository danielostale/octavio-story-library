import { Nav } from "@/components/nav";
import { PersonalStoryBuilder } from "@/components/personal-story-builder";
import { recommendedDurationMinutes } from "@/lib/age";

export default function PersonalStoryPage() {
  const birthDate = process.env.CHILD_BIRTH_DATE || "";
  const recommended = birthDate ? recommendedDurationMinutes(birthDate) : 10;

  return (
    <>
      <Nav />
      <main className="shell narrow">
        <p className="eyebrow">HISTORIA FAMILIAR</p>
        <h1>Cuéntala con tu voz.</h1>
        <p className="lead">
          Gemini transcribe el recuerdo y después eliges entre una versión rápida o preparar un libro completo con ChatGPT.
        </p>
        <PersonalStoryBuilder recommendedDuration={recommended} />
      </main>
    </>
  );
}

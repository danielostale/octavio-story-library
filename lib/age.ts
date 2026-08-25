export function ageInMonths(birthDate: string, now = new Date()) {
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return 0;
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  return Math.max(0, months);
}

export function recommendedDurationMinutes(birthDate: string) {
  const months = ageInMonths(birthDate);
  if (months < 12) return 3;
  if (months < 24) return 4;
  if (months < 36) return 5;
  if (months < 60) return 7;
  if (months < 96) return 10;
  return 12;
}

export function childAgeLabel(birthDate: string) {
  const months = ageInMonths(birthDate);
  if (months < 1) return "recién nacido";
  if (months < 24) return `${months} meses`;
  const years = Math.floor(months / 12);
  const extraMonths = months % 12;
  return extraMonths ? `${years} años y ${extraMonths} meses` : `${years} años`;
}

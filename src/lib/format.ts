export function formatKey(key: string): string {
  const [y, m, d] = key.split("-");
  const months = [
    "JANVIER",
    "FÉVRIER",
    "MARS",
    "AVRIL",
    "MAI",
    "JUIN",
    "JUILLET",
    "AOÛT",
    "SEPTEMBRE",
    "OCTOBRE",
    "NOVEMBRE",
    "DÉCEMBRE",
  ];
  return `${Number(d)} ${months[Number(m) - 1]} ${y}`;
}

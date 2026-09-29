export function angkaTerbilang(n: number): string {
  const satuan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  if (n < 12) return satuan[n];
  if (n < 20) return `${satuan[n - 10]} Belas`;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const rem = n % 10;
    return `${satuan[tens]} Puluh${rem ? ` ${satuan[rem]}` : ""}`;
  }
  if (n < 200) return `Seratus${n > 100 ? ` ${angkaTerbilang(n - 100)}` : ""}`;
  if (n < 1000) {
    const h = Math.floor(n / 100);
    return `${satuan[h]} Ratus${n % 100 ? ` ${angkaTerbilang(n % 100)}` : ""}`;
  }
  if (n < 2000)
    return `Seribu${n > 1000 ? ` ${angkaTerbilang(n - 1000)}` : ""}`;
  if (n < 1_000_000) {
    const th = Math.floor(n / 1000);
    return `${angkaTerbilang(th)} Ribu${n % 1000 ? ` ${angkaTerbilang(n % 1000)}` : ""}`;
  }
  if (n < 1_000_000_000) {
    const jt = Math.floor(n / 1_000_000);
    return `${angkaTerbilang(jt)} Juta${n % 1_000_000 ? ` ${angkaTerbilang(n % 1_000_000)}` : ""}`;
  }
  const ml = Math.floor(n / 1_000_000_000);
  return `${angkaTerbilang(ml)} Miliar${n % 1_000_000_000 ? ` ${angkaTerbilang(n % 1_000_000_000)}` : ""}`;
}

export function terbilang(amount: number): string {
  if (amount === 0) return '"Nol Rupiah"';
  return `"${angkaTerbilang(amount)} Rupiah"`;
}

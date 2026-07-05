import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { DataSampahItem } from "@/db/schema/bukti-pembayaran";

// Register fonts
Font.register({
  family: "Times New Roman",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/sourceserif4/v14/vEFy2_tTDB4M7-auWDN0ahZJW3IX2ih5nk3AucvUHf6OAVIJmeUDygwjihdqrhw.ttf",
      fontWeight: "normal",
      fontStyle: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/sourceserif4/v14/vEFy2_tTDB4M7-auWDN0ahZJW3IX2ih5nk3AucvUHf6OAVIJmeUDygwjivBtrhw.ttf",
      fontWeight: "bold",
      fontStyle: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/sourceserif4/v14/vEF02_tTDB4M7-auWDN0ahZJW1ge6NmXpVAHV83Bfb_US2D2QYxoUKIkn98pRl9dCw.ttf",
      fontWeight: "normal",
      fontStyle: "italic",
    },
    {
      src: "https://fonts.gstatic.com/s/sourceserif4/v14/vEF02_tTDB4M7-auWDN0ahZJW1ge6NmXpVAHV83Bfb_US2D2QYxoUKIkn98poVhdCw.ttf",
      fontWeight: "bold",
      fontStyle: "italic",
    },
  ],
});

const DARK = "#333333";
const _ACCENT = "#1a5276";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times New Roman",
    fontSize: 9,
    color: DARK,
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 40,
    backgroundColor: "#ffffff",
  },
  // ── Header ────────────────────────────────────────────────
  headerRule: {
    borderTopWidth: 2,
    borderTopColor: DARK,
    borderTopStyle: "solid",
    marginBottom: 2,
  },
  headerRuleThin: {
    borderTopWidth: 1,
    borderTopColor: DARK,
    borderTopStyle: "solid",
    marginBottom: 6,
  },
  headerTitle: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "bold",
    textDecoration: "underline",
    marginBottom: 2,
    color: DARK,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  docNumber: { fontSize: 9, fontWeight: "bold" },
  docDate: { fontSize: 9 },
  // ── Sections ──────────────────────────────────────────────
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
    color: DARK,
  },
  sectionBlock: {
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 2,
  },
  labelCol: {
    width: 120,
    fontSize: 9,
    paddingLeft: 4,
  },
  colonCol: {
    width: 10,
    fontSize: 9,
  },
  valueCol: {
    flex: 1,
    fontSize: 9,
  },
  // ── Sampah table ──────────────────────────────────────────
  sampahRow: {
    flexDirection: "row",
    marginBottom: 1,
    paddingLeft: 4,
  },
  sampahNo: { width: 20, fontSize: 9 },
  sampahLabel: { flex: 1, fontSize: 9 },
  sampahColon: { width: 10, fontSize: 9 },
  sampahBerat: { width: 45, fontSize: 9, textAlign: "right" },
  sampahUnit: { width: 22, fontSize: 9 },
  // ── Total berat ───────────────────────────────────────────
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#999",
    borderTopStyle: "dashed",
    paddingTop: 3,
    marginTop: 3,
    marginBottom: 3,
    paddingLeft: 4,
  },
  totalLabel: { flex: 1, fontWeight: "bold", fontSize: 9 },
  totalColon: { width: 10, fontSize: 9 },
  totalBerat: {
    width: 45,
    fontWeight: "bold",
    fontSize: 9,
    textAlign: "right",
  },
  totalUnit: { width: 22, fontSize: 9 },
  totalTon: { width: 45, fontSize: 9, textAlign: "right" },
  // ── Pembayaran ────────────────────────────────────────────
  payRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 4,
  },
  payLabel: { width: 140, fontSize: 9 },
  payColon: { width: 10, fontSize: 9 },
  payValue: { flex: 1, fontSize: 9 },
  payLabelBold: { width: 140, fontWeight: "bold", fontSize: 9 },
  payValueBold: { flex: 1, fontWeight: "bold", fontSize: 9 },
  // ── TTD area ──────────────────────────────────────────────
  ttdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  ttdBox: {
    width: "45%",
    alignItems: "flex-start",
  },
  ttdLabel: { fontSize: 9, marginBottom: 48 },
  ttdImage: {
    width: 90,
    height: 45,
    objectFit: "contain",
    position: "absolute",
    top: 18,
    left: 0,
  },
  ttdLine: {
    width: 140,
    borderBottomWidth: 1,
    borderBottomColor: DARK,
    borderBottomStyle: "solid",
    marginBottom: 2,
  },
  ttdName: { fontSize: 9, fontWeight: "bold", textDecoration: "underline" },
  ttdJabatan: { fontSize: 8 },
  // ── Lampiran ──────────────────────────────────────────────
  lampiranRow: {
    flexDirection: "row",
    marginBottom: 1,
    paddingLeft: 4,
  },
  lampiranNo: { width: 20, fontSize: 9 },
  lampiranLabel: { flex: 1, fontSize: 9 },
  lampiranStatus: { width: 80, fontSize: 9 },
  // ── Metode pembayaran ─────────────────────────────────────
  metodeRow: {
    flexDirection: "row",
    gap: 12,
    paddingLeft: 4,
    marginTop: 4,
    marginBottom: 2,
  },
  metodeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    fontSize: 9,
  },
  checkbox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: DARK,
    borderStyle: "solid",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxInner: {
    width: 5,
    height: 5,
    backgroundColor: DARK,
  },
});

function angkaTerbilang(n: number): string {
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

function terbilang(amount: number): string {
  if (amount === 0) return '"Nol Rupiah"';
  return `"${angkaTerbilang(amount)} Rupiah"`;
}

function formatRupiah(n: number): string {
  return `Rp${n.toLocaleString("id-ID")},00`;
}

const BULAN_ROMAWI: Record<string, string> = {
  Januari: "I",
  Februari: "II",
  Maret: "III",
  April: "IV",
  Mei: "V",
  Juni: "VI",
  Juli: "VII",
  Agustus: "VIII",
  September: "IX",
  Oktober: "X",
  November: "XI",
  Desember: "XII",
};

export interface BuktiPembayaranData {
  nomorDokumen: string;
  tanggal: Date | string;

  // Identitas
  namaBankSampah: string;
  idPelanggan: string;
  nama: string;
  alamat?: string | null;
  noTelepon?: string | null;

  // Periode
  periodeBulan: string;
  periodeTahun: number;
  kategoriSumber: string; // "bank_sampah_induk" | "tps_3r" | "bank_sampah_unit"

  // Data Sampah
  dataSampah: DataSampahItem[];
  totalBeratKg: number;

  // Pembayaran
  tarifDasar: number;
  biayaTambahan: number;
  totalTagihan: number;
  metodePembayaran: string; // "tunai" | "transfer" | "qris"
  keterangan?: string | null;

  // TTD
  ttdPenyerahUrl?: string | null;
  ttdPenerimaUrl?: string | null;
  namaPenyerah?: string | null;
  jabatanPenyerah?: string | null;
  namaPenerima?: string | null;
  jabatanPenerima?: string | null;
}

interface CheckBoxProps {
  checked: boolean;
}
function CheckBox({ checked }: CheckBoxProps) {
  return (
    <View style={styles.checkbox}>
      {checked && <View style={styles.checkboxInner} />}
    </View>
  );
}

export function BuktiPembayaranDocument({
  data,
}: {
  data: BuktiPembayaranData;
}) {
  const tanggalObj = new Date(data.tanggal);
  const hariNama = tanggalObj.toLocaleDateString("id-ID", { weekday: "long" });
  const tanggalFmt = tanggalObj.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const _bulanRomawi = BULAN_ROMAWI[data.periodeBulan] ?? "";
  const totalTon = (data.totalBeratKg / 1000).toFixed(5);

  return (
    <Document
      title={`Bukti Pembayaran - ${data.nomorDokumen}`}
      author="Bank Sampah BJB / TPS 3R"
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.headerRule} />
        <View style={styles.headerRuleThin} />
        <Text style={styles.headerTitle}>
          BUKTI PEMBAYARAN &amp; JASA PENGELOLAAN SAMPAH
        </Text>
        <View style={[styles.headerRule, { marginTop: 4 }]} />

        <View style={[styles.headerRow, { marginTop: 6 }]}>
          <View>
            <Text style={styles.docNumber}>
              No. Dokumen : {data.nomorDokumen}
            </Text>
          </View>
          <Text style={styles.docDate}>
            {hariNama}, {tanggalFmt}
          </Text>
        </View>

        {/* ── I. IDENTITAS PELANGGAN ────────────────────────── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>I. IDENTITAS PELANGGAN</Text>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Nama Bank Sampah</Text>
            <Text style={styles.colonCol}>:</Text>
            <Text style={styles.valueCol}>{data.namaBankSampah}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>ID Pelanggan</Text>
            <Text style={styles.colonCol}>:</Text>
            <Text style={styles.valueCol}>{data.idPelanggan}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Nama</Text>
            <Text style={styles.colonCol}>:</Text>
            <Text style={styles.valueCol}>{data.nama}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Alamat</Text>
            <Text style={styles.colonCol}>:</Text>
            <Text style={styles.valueCol}>{data.alamat ?? "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>No. Telepon/HP</Text>
            <Text style={styles.colonCol}>:</Text>
            <Text style={styles.valueCol}>{data.noTelepon ?? "-"}</Text>
          </View>
        </View>

        {/* ── II. PERIODE & DETAIL ──────────────────────────── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>
            II. PERIODE &amp; DETAIL PENGELOLAAN
          </Text>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Periode Layanan</Text>
            <Text style={styles.colonCol}>:</Text>
            <Text style={styles.valueCol}>
              Bulan {data.periodeBulan} {data.periodeTahun}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Kategori Sumber</Text>
            <Text style={styles.colonCol}>:</Text>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
                flex: 1,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <CheckBox
                  checked={data.kategoriSumber === "bank_sampah_induk"}
                />
                <Text style={{ fontSize: 9 }}> Bank Sampah Induk</Text>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <CheckBox checked={data.kategoriSumber === "tps_3r"} />
                <Text style={{ fontSize: 9 }}> TPS 3R</Text>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <CheckBox
                  checked={data.kategoriSumber === "bank_sampah_unit"}
                />
                <Text style={{ fontSize: 9 }}> Bank Sampah Unit</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── III. DATA BERAT SAMPAH ────────────────────────── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>
            III. DATA BERAT SAMPAH (BULANAN)
          </Text>
          {data.dataSampah.map((item, i) => (
            <View key={item.jenis} style={styles.sampahRow}>
              <Text style={styles.sampahNo}>{i + 1}.</Text>
              <Text style={styles.sampahLabel}>{item.jenis}</Text>
              <Text style={styles.sampahColon}>:</Text>
              <Text style={styles.sampahBerat}>{item.beratKg.toFixed(2)}</Text>
              <Text style={styles.sampahUnit}> kg</Text>
            </View>
          ))}
          <View
            style={[
              {
                borderTopWidth: 1,
                borderTopColor: "#888",
                borderTopStyle: "dashed",
                marginLeft: 4,
                marginRight: 4,
              },
            ]}
          />
          <View style={[styles.sampahRow, { marginTop: 3 }]}>
            <Text style={[styles.sampahNo, { fontWeight: "bold" }]}></Text>
            <Text style={[styles.sampahLabel, { fontWeight: "bold" }]}>
              TOTAL BERAT SAMPAH
            </Text>
            <Text style={styles.sampahColon}>:</Text>
            <Text style={[styles.sampahBerat, { fontWeight: "bold" }]}>
              {data.totalBeratKg.toFixed(2)}
            </Text>
            <Text style={[styles.sampahUnit, { fontWeight: "bold" }]}> kg</Text>
            <Text style={{ fontSize: 9, marginLeft: 8 }}>{totalTon} ton</Text>
          </View>
        </View>

        {/* ── IV. LAMPIRAN DOKUMEN ──────────────────────────── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>IV. LAMPIRAN DOKUMEN</Text>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Dokumentasi pengelolaan</Text>
            <Text style={styles.colonCol}>:</Text>
            <View style={{ flex: 1 }}>
              {data.dataSampah.map((item, i) => (
                <View
                  key={`lamp-${item.jenis}`}
                  style={{ flexDirection: "row", marginBottom: 1 }}
                >
                  <Text style={{ fontSize: 9, flex: 1 }}>
                    {i + 1}. {item.jenis}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 3,
                      width: 90,
                    }}
                  >
                    <CheckBox checked={item.terlampir} />
                    <Text style={{ fontSize: 9 }}>
                      {item.terlampir ? " Terlampir" : " Tidak Terlampir"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── V. RINCIAN PEMBAYARAN ─────────────────────────── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>V. RINCIAN PEMBAYARAN</Text>
          <View style={styles.payRow}>
            <Text style={styles.payLabel}>Tarif Dasar Pengelolaan</Text>
            <Text style={styles.payColon}>:</Text>
            <Text style={styles.payValue}>{formatRupiah(data.tarifDasar)}</Text>
          </View>
          <View style={styles.payRow}>
            <Text style={styles.payLabel}>Biaya Tambahan Per Kg/Ton</Text>
            <Text style={styles.payColon}>:</Text>
            <Text style={styles.payValue}>
              {formatRupiah(data.biayaTambahan)}
            </Text>
          </View>
          <View
            style={[
              styles.payRow,
              {
                borderTopWidth: 1,
                borderTopColor: "#999",
                borderTopStyle: "solid",
                paddingTop: 2,
                marginTop: 2,
              },
            ]}
          >
            <Text style={styles.payLabelBold}>TOTAL TAGIHAN</Text>
            <Text style={styles.payColon}>:</Text>
            <Text style={styles.payValueBold}>
              {formatRupiah(data.totalTagihan)}
            </Text>
          </View>
          <View style={[styles.payRow, { marginTop: 4 }]}>
            <Text style={styles.payLabel}>TERBILANG</Text>
            <Text style={styles.payColon}>:</Text>
            <Text
              style={[
                styles.payValue,
                { fontWeight: "bold", fontStyle: "italic" },
              ]}
            >
              {terbilang(data.totalTagihan)}
            </Text>
          </View>

          {/* Metode Pembayaran */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingLeft: 4,
              marginTop: 6,
            }}
          >
            <Text style={{ fontSize: 9, marginRight: 6, fontWeight: "bold" }}>
              Metode Pembayaran :
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
                marginRight: 12,
              }}
            >
              <CheckBox checked={data.metodePembayaran === "tunai"} />
              <Text style={{ fontSize: 9 }}> Tunai</Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
            >
              <CheckBox checked={data.metodePembayaran === "transfer"} />
              <Text style={{ fontSize: 9 }}> Transfer Bank</Text>
            </View>
          </View>

          {/* Keterangan */}
          <View style={[styles.row, { marginTop: 6 }]}>
            <Text style={[styles.labelCol, { paddingLeft: 4 }]}>
              Keterangan / Catatan
            </Text>
            <Text style={styles.colonCol}>:</Text>
            <Text style={styles.valueCol}>{data.keterangan ?? ""}</Text>
          </View>
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#888",
              borderBottomStyle: "solid",
              marginTop: 2,
              marginLeft: 4,
            }}
          />
        </View>

        {/* ── TTD Area ─────────────────────────────────────── */}
        <View style={styles.ttdRow}>
          {/* Kiri — Diserahkan Oleh */}
          <View style={styles.ttdBox}>
            <Text style={styles.ttdLabel}>Diserahkan Oleh,</Text>
            {data.ttdPenyerahUrl ? (
              <Image src={data.ttdPenyerahUrl} style={styles.ttdImage} />
            ) : null}
            <View style={{ marginTop: 4 }}>
              <View style={styles.ttdLine} />
              {data.namaPenyerah ? (
                <Text style={styles.ttdName}>({data.namaPenyerah})</Text>
              ) : null}
              {data.jabatanPenyerah ? (
                <Text style={styles.ttdJabatan}>{data.jabatanPenyerah}</Text>
              ) : null}
            </View>
          </View>

          {/* Kanan — Diterima Oleh */}
          <View style={[styles.ttdBox, { alignItems: "flex-start" }]}>
            <Text style={styles.ttdLabel}>Diterima Oleh,</Text>
            {data.ttdPenerimaUrl ? (
              <Image src={data.ttdPenerimaUrl} style={styles.ttdImage} />
            ) : null}
            <View style={{ marginTop: 4 }}>
              <Text style={[styles.ttdJabatan, { fontWeight: "bold" }]}>
                PT. Indofood CBP Sukses Makmur Tbk,
              </Text>
              <Text
                style={[
                  styles.ttdJabatan,
                  { fontStyle: "italic", fontSize: 8 },
                ]}
              >
                [ Cap / Stempel Resmi ]
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

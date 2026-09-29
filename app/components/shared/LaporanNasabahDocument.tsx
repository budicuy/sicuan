import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    color: "#333333",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#10b981",
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f766e",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 9,
    color: "#666666",
    textAlign: "center",
    marginTop: 3,
  },
  infoSection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 5,
  },
  infoTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 5,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  infoLabel: {
    width: 100,
    color: "#6b7280",
  },
  infoValue: {
    flex: 1,
    color: "#1f2937",
    fontWeight: "bold",
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 20,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    backgroundColor: "#f3f4f6",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 6,
    fontWeight: "bold",
  },
  tableCol: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 6,
  },
  summarySection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 15,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  summaryItem: {
    fontSize: 10,
    fontWeight: "bold",
  },
});

interface SetoranItem {
  id: number;
  nomorSetor: string;
  jenisSampah: string;
  beratKg: number;
  tanggalSetor: string;
  catatan: string | null;
  totalPoin: number;
  status: string;
}

interface LaporanNasabahData {
  profile: {
    id: number;
    userId: number;
    nik: string | null;
    noTelepon: string | null;
    alamat: string | null;
    poin: number | null;
    user: {
      name: string;
      role: string;
      username: string;
    };
  };
  setoran: SetoranItem[];
}

export function LaporanNasabahDocument({ data }: { data: LaporanNasabahData }) {
  const { profile, setoran } = data;
  const totalBerat = setoran.reduce((sum, s) => sum + s.beratKg, 0);
  const totalKredit = setoran.reduce((sum, s) => sum + s.totalPoin, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>LAPORAN LOG SETORAN SAMPAH NASABAH</Text>
          <Text style={styles.subtitle}>Bank Sampah PT. Indofood</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>PROFIL NASABAH</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nama Nasabah</Text>
            <Text style={styles.infoValue}>: {profile.user.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>NIK</Text>
            <Text style={styles.infoValue}>: {profile.nik || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipe Nasabah</Text>
            <Text style={styles.infoValue}>
              : {profile.user.role.toUpperCase()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>No. Telepon / WA</Text>
            <Text style={styles.infoValue}>: {profile.noTelepon || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Alamat</Text>
            <Text style={styles.infoValue}>: {profile.alamat || "-"}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, { width: "25%" }]}>
              <Text>Nomor Setor</Text>
            </View>
            <View style={[styles.tableColHeader, { width: "20%" }]}>
              <Text>Jenis Sampah</Text>
            </View>
            <View style={[styles.tableColHeader, { width: "15%" }]}>
              <Text>Berat</Text>
            </View>
            <View style={[styles.tableColHeader, { width: "20%" }]}>
              <Text>Kredit (Rp)</Text>
            </View>
            <View style={[styles.tableColHeader, { width: "20%" }]}>
              <Text>Tanggal Setor</Text>
            </View>
          </View>
          {setoran.map((s) => (
            <View key={s.id} style={styles.tableRow}>
              <View style={[styles.tableCol, { width: "25%" }]}>
                <Text>{s.nomorSetor}</Text>
              </View>
              <View style={[styles.tableCol, { width: "20%" }]}>
                <Text>{s.jenisSampah}</Text>
              </View>
              <View style={[styles.tableCol, { width: "15%" }]}>
                <Text>{s.beratKg} kg</Text>
              </View>
              <View style={[styles.tableCol, { width: "20%" }]}>
                <Text>Rp {s.totalPoin.toLocaleString("id-ID")}</Text>
              </View>
              <View style={[styles.tableCol, { width: "20%" }]}>
                <Text>{s.tanggalSetor}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryItem}>
            Total Transaksi: {setoran.length}
          </Text>
          <Text style={styles.summaryItem}>
            Total Berat: {totalBerat.toLocaleString("id-ID")} kg
          </Text>
          <Text style={styles.summaryItem}>
            Total Saldo Kredit: Rp {totalKredit.toLocaleString("id-ID")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

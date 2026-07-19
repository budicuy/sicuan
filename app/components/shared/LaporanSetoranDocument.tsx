import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8,
    color: "#333333",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#4f46e5",
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e1b4b",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 9,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 3,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    gap: 15,
  },
  metaItem: {
    minWidth: 100,
  },
  metaLabel: {
    fontSize: 7,
    color: "#9ca3af",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 9,
    color: "#1f2937",
    fontWeight: "bold",
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f8fafc",
  },
  metricLabel: {
    fontSize: 7,
    color: "#64748b",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 4,
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
    flexDirection: "row",
  },
  tableColHeader: {
    backgroundColor: "#f1f5f9",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
    fontWeight: "bold",
  },
  tableCol: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    color: "#94a3b8",
    fontSize: 7,
  },
});

interface LaporanItem {
  id: number;
  nomorSetor: string;
  nasabah: string;
  kategoriNasabah: string;
  jenisSampah: string;
  beratKg: number;
  tanggalSetor: string;
  status: string;
  metodeSetor: string | null;
  totalPoin: number;
  kredit: number;
}

interface LaporanSetoranDocumentProps {
  data: {
    filters: {
      tahun: string;
      bulan: string;
      kategori: string;
      jenisSampah: string;
      status: string;
      metodeSetor: string;
    };
    summary: {
      totalSetoran: number;
      totalBerat: number;
      totalKredit: number;
      totalPoin: number;
    };
    columns: string[];
    items: LaporanItem[];
  };
  orientation?: "portrait" | "landscape";
}

export function LaporanSetoranDocument({
  data,
  orientation = "portrait",
}: LaporanSetoranDocumentProps) {
  const { filters, summary, columns, items } = data;

  const colDefinitions = [
    { key: "nomorSetor", label: "No. Setor" },
    { key: "nasabah", label: "Nasabah" },
    { key: "kategoriNasabah", label: "Kategori" },
    { key: "jenisSampah", label: "Jenis" },
    { key: "beratKg", label: "Berat" },
    { key: "tanggalSetor", label: "Tanggal" },
    { key: "status", label: "Status" },
    { key: "metodeSetor", label: "Metode" },
    { key: "kredit", label: "Kredit/Poin" },
  ];

  const colWeights: Record<string, number> = {
    nomorSetor: 2.3,
    nasabah: 1.8,
    kategoriNasabah: 1.0,
    jenisSampah: 1.0,
    beratKg: 0.8,
    tanggalSetor: 1.2,
    status: 1.0,
    metodeSetor: 1.0,
    kredit: 1.2,
  };

  const activeCols = colDefinitions.filter((col) => columns.includes(col.key));
  const totalWeight = activeCols.reduce(
    (sum, col) => sum + (colWeights[col.key] || 1.0),
    0,
  );
  const getColWidth = (key: string) => {
    const weight = colWeights[key] || 1.0;
    return `${(weight / totalWeight) * 100}%`;
  };

  const getColValue = (item: LaporanItem, key: string) => {
    switch (key) {
      case "nomorSetor":
        return item.nomorSetor;
      case "nasabah":
        return item.nasabah;
      case "kategoriNasabah":
        return item.kategoriNasabah === "warmindo"
          ? "Warmindo"
          : item.kategoriNasabah === "bank-sampah"
            ? "Bank Sampah"
            : "Konsumen";
      case "jenisSampah":
        return item.jenisSampah;
      case "beratKg":
        return `${item.beratKg} kg`;
      case "tanggalSetor":
        return item.tanggalSetor;
      case "status":
        return item.status.toUpperCase();
      case "metodeSetor":
        return item.metodeSetor === "ekspedisi" ? "Ekspedisi" : "Langsung";
      case "kredit":
        if (item.kredit > 0) return `Rp ${item.kredit.toLocaleString("id-ID")}`;
        if (item.totalPoin > 0)
          return `${item.totalPoin.toLocaleString("id-ID")} pt`;
        return "-";
      default:
        return "";
    }
  };

  return (
    <Document>
      <Page size="A4" orientation={orientation} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>LAPORAN SETORAN SAMPAH</Text>
        </View>

        {/* Filter Info */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Tahun</Text>
            <Text style={styles.metaValue}>{filters.tahun}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Bulan</Text>
            <Text style={styles.metaValue}>{filters.bulan}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Kategori Nasabah</Text>
            <Text style={styles.metaValue}>{filters.kategori}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Jenis Sampah</Text>
            <Text style={styles.metaValue}>{filters.jenisSampah}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>{filters.status}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Metode</Text>
            <Text style={styles.metaValue}>{filters.metodeSetor}</Text>
          </View>
        </View>

        {/* Metrics summary */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Setoran</Text>
            <Text style={styles.metricValue}>
              {summary.totalSetoran.toLocaleString("id-ID")} x
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Berat</Text>
            <Text style={styles.metricValue}>
              {summary.totalBerat.toLocaleString("id-ID")} kg
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Kredit</Text>
            <Text style={styles.metricValue}>
              Rp {summary.totalKredit.toLocaleString("id-ID")}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Poin</Text>
            <Text style={styles.metricValue}>
              {summary.totalPoin.toLocaleString("id-ID")} pt
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableRow}>
            {activeCols.map((col) => (
              <View
                key={col.key}
                style={[styles.tableColHeader, { width: getColWidth(col.key) }]}
              >
                <Text style={{ fontWeight: "bold", fontSize: 7.5 }}>
                  {col.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          {items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              {activeCols.map((col) => (
                <View
                  key={col.key}
                  style={[styles.tableCol, { width: getColWidth(col.key) }]}
                >
                  <Text style={{ fontSize: 7 }}>
                    {getColValue(item, col.key)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Dicetak pada: {new Date().toLocaleString("id-ID")}</Text>
          <Text>
            SICUAN - Sistem Informasi Cerdas Ubah Anorganik Jadi Nilai
          </Text>
        </View>
      </Page>
    </Document>
  );
}

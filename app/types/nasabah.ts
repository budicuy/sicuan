/**
 * nasabah.ts — Types terkait data nasabah dan profil pengguna.
 */

export interface NasabahWithUser {
  id: number;
  userId: number;
  nik: string | null;
  tanggalLahir: string | null;
  noTelepon: string | null;
  email: string | null;
  alamat: string | null;
  jenisBank: string | null;
  noRekening: string | null;
  poin: number;
  user: {
    name: string;
    username: string;
    role: string;
    status: string;
  };
}

/**
 * ProfileData — data profil pengguna (konsumen, warmindo, bank-sampah).
 * Field opsional (`null` possible) direpresentasikan dengan string karena
 * form input selalu mengembalikan string.
 */
export interface ProfileData {
  id: number;
  name: string;
  username: string;
  role: string;
  status: string;
  nik: string;
  tanggalLahir: string;
  noTelepon: string;
  alamat: string;
  jenisBank: string;
  noRekening: string;
  email: string;
}

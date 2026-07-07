/**
 * common.ts — Types umum yang dipakai di seluruh aplikasi.
 */

/**
 * ActionState — return type standar untuk semua server actions.
 * `message` bersifat opsional; beberapa actions (pencairan dana) menggunakannya.
 */
export type ActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

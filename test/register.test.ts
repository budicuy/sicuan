import { describe, expect, mock, test } from "bun:test";

// Mock the database module to prevent network calls during testing
mock.module("../db", () => {
  return {
    db: {
      query: {
        users: {
          findFirst: async (options?: { where?: unknown }) => {
            const seen = new WeakSet();
            const queryStr = JSON.stringify(options || {}, (_key, value) => {
              if (typeof value === "object" && value !== null) {
                if (seen.has(value)) return "[Circular]";
                seen.add(value);
              }
              return value;
            });
            if (queryStr.includes("existing.user")) {
              return { id: 1, username: "existing.user" };
            }
            return null;
          },
        },
        nasabah: {
          findFirst: async (options?: { where?: unknown }) => {
            const seen = new WeakSet();
            const queryStr = JSON.stringify(options || {}, (_key, value) => {
              if (typeof value === "object" && value !== null) {
                if (seen.has(value)) return "[Circular]";
                seen.add(value);
              }
              return value;
            });
            if (queryStr.includes("1234567890123456")) {
              return {
                id: 2,
                username: "another.user",
                nik: "1234567890123456",
              };
            }
            return null;
          },
        },
      },
      transaction: async (callback: any) => {
        const tx = {
          insert: () => {
            return {
              values: () => {
                return {
                  returning: async () => {
                    return [
                      {
                        id: 99,
                        name: "Register Test User",
                        username: "new.user",
                        role: "konsumen",
                        status: "Aktif",
                      },
                    ];
                  },
                };
              },
            };
          },
        };
        return await callback(tx);
      },
      insert: () => {
        return {
          values: () => {
            return {
              returning: async () => {
                return [
                  {
                    id: 99,
                    name: "Register Test User",
                    username: "new.user",
                    role: "konsumen",
                    status: "Aktif",
                  },
                ];
              },
            };
          },
        };
      },
    },
  };
});

// Mock cookies header to prevent next/headers server errors during test execution
mock.module("next/headers", () => {
  return {
    cookies: async () => {
      return {
        set: () => {},
        get: () => null,
      };
    },
  };
});

import { registerAction } from "../app/register/action";

describe("Registrasi Akun Baru", () => {
  test("Gagal jika data masukan tidak valid (username terlalu pendek)", async () => {
    const formData = new FormData();
    formData.append("name", "Budi Santoso");
    formData.append("username", "bu"); // terlalu pendek
    formData.append("password", "Password123");
    formData.append("role", "konsumen");
    formData.append("email", "budi@example.com");

    const state = await registerAction(null, formData);
    expect(state.success).toBe(false);
    expect(state.error).toContain("Username minimal 3 karakter");
  });

  test("Gagal jika password terlalu pendek", async () => {
    const formData = new FormData();
    formData.append("name", "Budi Santoso");
    formData.append("username", "budi.baru");
    formData.append("password", "123"); // terlalu pendek
    formData.append("role", "konsumen");
    formData.append("email", "budi@example.com");

    const state = await registerAction(null, formData);
    expect(state.success).toBe(false);
    expect(state.error).toContain("Password minimal 6 karakter");
  });

  test("Gagal jika username mengandung karakter tidak valid", async () => {
    const formData = new FormData();
    formData.append("name", "Budi Santoso");
    formData.append("username", "budi santoso!"); // spasi dan tanda seru tidak boleh
    formData.append("password", "Password123");
    formData.append("role", "konsumen");
    formData.append("email", "budi@example.com");

    const state = await registerAction(null, formData);
    expect(state.success).toBe(false);
    expect(state.error).toContain(
      "Username hanya boleh mengandung huruf, angka, titik, underscore, dan hyphen",
    );
  });

  test("Gagal jika email tidak diisi", async () => {
    const formData = new FormData();
    formData.append("name", "Budi Santoso");
    formData.append("username", "new.user");
    formData.append("password", "Password123");
    formData.append("role", "konsumen");
    // Email sengaja tidak diisi

    const state = await registerAction(null, formData);
    expect(state.success).toBe(false);
    expect(state.error).toBe("Email wajib diisi");
  });

  test("Gagal jika format email tidak valid", async () => {
    const formData = new FormData();
    formData.append("name", "Budi Santoso");
    formData.append("username", "new.user");
    formData.append("password", "Password123");
    formData.append("role", "konsumen");
    formData.append("email", "bukan-email-yang-valid"); // format salah

    const state = await registerAction(null, formData);
    expect(state.success).toBe(false);
    expect(state.error).toBe("Format email tidak valid");
  });

  test("Gagal jika username sudah terdaftar", async () => {
    const formData = new FormData();
    formData.append("name", "Budi Santoso");
    formData.append("username", "existing.user");
    formData.append("password", "Password123");
    formData.append("role", "konsumen");
    formData.append("email", "budi@example.com");

    const state = await registerAction(null, formData);
    expect(state.success).toBe(false);
    expect(state.error).toBe("Username sudah terdaftar di sistem");
  });

  test("Gagal jika NIK sudah terdaftar", async () => {
    const formData = new FormData();
    formData.append("name", "Budi Santoso");
    formData.append("username", "new.user");
    formData.append("password", "Password123");
    formData.append("role", "konsumen");
    formData.append("email", "budi@example.com");
    formData.append("nik", "1234567890123456"); // NIK sudah terdaftar

    const state = await registerAction(null, formData);
    expect(state.success).toBe(false);
    expect(state.error).toBe("NIK sudah terdaftar di sistem");
  });

  test("Berhasil registrasi tanpa NIK (NIK bersifat opsional) dengan email yang diisi", async () => {
    const formData = new FormData();
    formData.append("name", "Budi Santoso");
    formData.append("username", "new.user");
    formData.append("password", "Password123");
    formData.append("role", "konsumen");
    formData.append("email", "budi@example.com");
    // NIK dibiarkan kosong

    const state = await registerAction(null, formData);
    expect(state.success).toBe(true);
    expect(state.user?.name).toBe("Register Test User");
    expect(state.user?.username).toBe("new.user");
  });

  test("Berhasil registrasi dengan NIK yang valid dan email yang diisi", async () => {
    const formData = new FormData();
    formData.append("name", "Budi Santoso");
    formData.append("username", "new.user");
    formData.append("password", "Password123");
    formData.append("role", "konsumen");
    formData.append("email", "budi@example.com");
    formData.append("nik", "9998887776665554"); // NIK baru dan valid

    const state = await registerAction(null, formData);
    expect(state.success).toBe(true);
    expect(state.user?.name).toBe("Register Test User");
  });
});

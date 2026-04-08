import { z } from 'zod';

// Jika punya enum Role, gunakan z.nativeEnum(Role)
export const RegisterSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100, 'Nama terlalu panjang'),
  email: z.email('Format email tidak valid').min(1, 'Email wajib diisi'),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter')
    .max(50, 'Password terlalu panjang'),
  role: z.string().optional(), 
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * LoginSchema menggunakan .pick() dari RegisterSchema
 * Ini menjamin aturan email & password selalu sinkron antara Register dan Login
 */
export const LoginSchema = RegisterSchema.pick({
  email: true,
  password: true,
});

export type LoginInput = z.infer<typeof LoginSchema>;

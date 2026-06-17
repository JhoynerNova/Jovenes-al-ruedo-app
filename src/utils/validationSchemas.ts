import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Por favor ingresa un correo electrónico válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const registerSchema = z.object({
  role: z.enum(['artista', 'empresa']).default('artista'),
  fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Por favor ingresa un correo electrónico válido'),
  age: z
    .preprocess((val) => val === '' || val === undefined ? undefined : Number(val), z.number().optional()),
  artisticArea: z.string().optional(),
  sector: z.string().optional(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string().min(1, 'Por favor confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
}).superRefine((data, ctx) => {
  if (data.role === 'artista') {
    if (data.age === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La edad es requerida',
        path: ['age'],
      });
    } else if (data.age < 18 || data.age > 28) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes tener entre 18 y 28 años de edad para registrarte',
        path: ['age'],
      });
    }
    if (!data.artisticArea || data.artisticArea.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El área artística es requerida',
        path: ['artisticArea'],
      });
    }
  } else if (data.role === 'empresa') {
    if (!data.sector || data.sector.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El sector de la industria es requerido',
        path: ['sector'],
      });
    }
  }
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Por favor ingresa un correo electrónico válido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'El código/token es requerido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string().min(1, 'Por favor confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export const ARTISTIC_AREAS = [
  'Música',
  'Teatro',
  'Danza',
  'Pintura y Dibujo',
  'Escultura',
  'Literatura / Poesía',
  'Fotografía / Cine',
  'Diseño / Arte Digital',
  'Artesanías / Escenografía'
];

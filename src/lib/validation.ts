import { z } from 'zod';

// Input sanitization utility
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 1000); // Limit length
};

// Phone number validation and sanitization
export const phoneSchema = z.string()
  .min(10, 'Telefone deve ter pelo menos 10 dígitos')
  .max(15, 'Telefone deve ter no máximo 15 dígitos')
  .regex(/^[\d\s\-\(\)\+]+$/, 'Telefone contém caracteres inválidos')
  .transform(sanitizeInput);

// Email validation with sanitization
export const emailSchema = z.string()
  .email('Email inválido')
  .min(1, 'Email é obrigatório')
  .max(320, 'Email muito longo')
  .transform(sanitizeInput);

// CNPJ validation
export const cnpjSchema = z.string()
  .min(14, 'CNPJ deve ter 14 dígitos')
  .max(18, 'CNPJ inválido')
  .regex(/^[\d\/\.\-]+$/, 'CNPJ contém caracteres inválidos')
  .transform(sanitizeInput);

// Text field validation with sanitization
export const textSchema = (minLength = 1, maxLength = 500) => 
  z.string()
    .min(minLength, `Campo deve ter pelo menos ${minLength} caracteres`)
    .max(maxLength, `Campo deve ter no máximo ${maxLength} caracteres`)
    .transform(sanitizeInput);

// Name validation (no special characters except spaces, hyphens, apostrophes)
export const nameSchema = z.string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome muito longo')
  .regex(/^[a-zA-ZÀ-ÿ\s\-\']+$/, 'Nome contém caracteres inválidos')
  .transform(sanitizeInput);

// Password validation schema
export const passwordSchema = z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .max(128, 'Senha muito longa')
  .refine(val => /[A-Z]/.test(val), 'Senha deve conter pelo menos uma letra maiúscula')
  .refine(val => /[a-z]/.test(val), 'Senha deve conter pelo menos uma letra minúscula')
  .refine(val => /[0-9]/.test(val), 'Senha deve conter pelo menos um número')
  .refine(val => /[^A-Za-z0-9]/.test(val), 'Senha deve conter pelo menos um caractere especial');

// Numeric validation
export const numericSchema = (min = 0, max = Number.MAX_SAFE_INTEGER) =>
  z.number()
    .min(min, `Valor deve ser maior que ${min}`)
    .max(max, `Valor deve ser menor que ${max}`)
    .finite('Valor deve ser um número válido');

// Process number validation
export const processNumberSchema = z.string()
  .regex(/^[\d\-\.\/\s]+$/, 'Número do processo contém caracteres inválidos')
  .min(10, 'Número do processo muito curto')
  .max(50, 'Número do processo muito longo')
  .transform(sanitizeInput);

// Company name validation
export const companyNameSchema = z.string()
  .min(2, 'Nome da empresa deve ter pelo menos 2 caracteres')
  .max(200, 'Nome da empresa muito longo')
  .regex(/^[a-zA-ZÀ-ÿ\s\d\-\.\&\(\)]+$/, 'Nome da empresa contém caracteres inválidos')
  .transform(sanitizeInput);

// Address validation schemas
export const addressSchema = {
  street: textSchema(5, 200),
  number: z.string()
    .regex(/^[\da-zA-Z\s\-\/]+$/, 'Número contém caracteres inválidos')
    .max(20, 'Número muito longo')
    .transform(sanitizeInput),
  complement: textSchema(0, 100).optional(),
  neighborhood: textSchema(2, 100),
  city: textSchema(2, 100),
  state: z.string()
    .length(2, 'Estado deve ter 2 caracteres')
    .regex(/^[A-Z]{2}$/, 'Estado deve estar em maiúsculas')
    .transform(sanitizeInput),
  zipCode: z.string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido')
    .transform(sanitizeInput)
};

// Proposal validation schemas
export const proposalSchema = {
  clientName: nameSchema,
  processNumber: processNumberSchema.optional(),
  organizationName: companyNameSchema.optional(),
  cedibleValue: numericSchema(0.01),
  proposalValue: numericSchema(0.01),
  receiverType: z.enum(['pessoa_fisica', 'pessoa_juridica'], {
    errorMap: () => ({ message: 'Tipo de recebedor inválido' })
  }),
  description: textSchema(0, 2000).optional(),
  assignee: nameSchema.optional(),
  validUntil: z.date().min(new Date(), 'Data de validade deve ser futura')
};

// User registration validation
export const userRegistrationSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  companyName: companyNameSchema,
  cnpj: cnpjSchema,
  responsiblePhone: phoneSchema,
  whatsappNumber: phoneSchema.optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
});

// Team invitation validation
export const teamInvitationSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  whatsappNumber: phoneSchema.optional()
});

// Profile update validation
export const profileUpdateSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema
});

// Company update validation
export const companyUpdateSchema = z.object({
  name: companyNameSchema,
  cnpj: cnpjSchema,
  responsiblePhone: phoneSchema,
  responsibleEmail: emailSchema,
  addressStreet: addressSchema.street.optional(),
  addressNumber: addressSchema.number.optional(),
  addressComplement: addressSchema.complement,
  addressNeighborhood: addressSchema.neighborhood.optional(),
  addressCity: addressSchema.city.optional(),
  addressState: addressSchema.state.optional(),
  addressZipCode: addressSchema.zipCode.optional()
});
import { z } from 'zod';
// ─── Auth ────────────────────────────────────────────────────────────────────
export const signupSchema = z
    .object({
    loginId: z
        .string()
        .min(6, 'Login ID must be 6–12 characters')
        .max(12, 'Login ID must be 6–12 characters'),
    email: z.string().email('Invalid email address'),
    fullName: z.string().min(1, 'Full name is required'),
    password: z
        .string()
        .min(9, 'Password must be more than 8 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
})
    .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
});
export const loginSchema = z.object({
    loginId: z.string().min(1, 'Login ID is required'),
    password: z.string().min(1, 'Password is required'),
});
export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});
export const verifyOtpSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6, 'OTP must be 6 digits'),
});
export const resetPasswordSchema = z
    .object({
    email: z.string().email(),
    otp: z.string().length(6),
    password: z
        .string()
        .min(9, 'Password must be more than 8 characters')
        .regex(/[a-z]/, 'At least one lowercase letter')
        .regex(/[A-Z]/, 'At least one uppercase letter')
        .regex(/[^a-zA-Z0-9]/, 'At least one special character'),
    confirmPassword: z.string(),
})
    .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
});
// ─── Warehouse ───────────────────────────────────────────────────────────────
export const warehouseSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    shortCode: z
        .string()
        .min(2, 'Short code must be 2–5 characters')
        .max(5, 'Short code must be 2–5 characters')
        .regex(/^[A-Z0-9]+$/, 'Short code must be uppercase letters/numbers'),
    address: z.string().optional(),
});
// ─── Location ────────────────────────────────────────────────────────────────
export const locationSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    shortCode: z.string().min(1, 'Short code is required'),
    warehouseId: z.string().optional().nullable(),
    type: z.enum(['INTERNAL', 'VENDOR', 'CUSTOMER', 'ADJUSTMENT']).default('INTERNAL'),
});
// ─── Contact ─────────────────────────────────────────────────────────────────
export const contactSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    type: z.enum(['VENDOR', 'CUSTOMER', 'BOTH']),
});
// ─── Category ────────────────────────────────────────────────────────────────
export const categorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
});
// ─── Product ─────────────────────────────────────────────────────────────────
export const productSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    sku: z.string().min(1, 'SKU is required'),
    categoryId: z.string().optional().nullable(),
    uom: z.enum(['Units', 'kg', 'm', 'L', 'Box']),
    unitCost: z.number().min(0, 'Unit cost must be ≥ 0'),
    initialQty: z.number().min(0).optional(),
    initialLocationId: z.string().optional().nullable(),
});
// ─── Reorder Rule ────────────────────────────────────────────────────────────
export const reorderRuleSchema = z.object({
    productId: z.string(),
    warehouseId: z.string(),
    minQty: z.number().min(0),
    maxQty: z.number().min(0),
});
// ─── Operation ───────────────────────────────────────────────────────────────
export const operationLineSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().positive('Quantity must be > 0'),
    countedQuantity: z.number().min(0).optional(),
});
export const createOperationSchema = z.object({
    type: z.enum(['RECEIPT', 'DELIVERY', 'INTERNAL', 'ADJUSTMENT']),
    warehouseId: z.string().min(1, 'Warehouse is required'),
    sourceLocationId: z.string().optional().nullable(),
    destLocationId: z.string().optional().nullable(),
    contactId: z.string().optional().nullable(),
    deliveryAddress: z.string().optional(),
    operationTypeNote: z.string().optional(),
    scheduleDate: z.string().min(1, 'Schedule date is required'),
    responsibleId: z.string().optional().nullable(),
    lines: z.array(operationLineSchema).min(1, 'At least one line is required'),
});
export const updateOperationSchema = createOperationSchema.partial().omit({ type: true });
// ─── Profile ─────────────────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
});
export const changePasswordSchema = z
    .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(9, 'Password must be more than 8 characters')
        .regex(/[a-z]/, 'At least one lowercase letter')
        .regex(/[A-Z]/, 'At least one uppercase letter')
        .regex(/[^a-zA-Z0-9]/, 'At least one special character'),
    confirmPassword: z.string(),
})
    .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
});
// ─── Stock ───────────────────────────────────────────────────────────────────
export const stockUpdateSchema = z.object({
    productId: z.string(),
    locationId: z.string(),
    newQuantity: z.number().min(0, 'Quantity must be ≥ 0'),
});

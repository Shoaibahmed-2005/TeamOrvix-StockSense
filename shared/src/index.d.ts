import { z } from 'zod';
export declare const signupSchema: z.ZodEffects<z.ZodObject<{
    loginId: z.ZodString;
    email: z.ZodString;
    fullName: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    loginId: string;
    email: string;
    fullName: string;
    password: string;
    confirmPassword: string;
}, {
    loginId: string;
    email: string;
    fullName: string;
    password: string;
    confirmPassword: string;
}>, {
    loginId: string;
    email: string;
    fullName: string;
    password: string;
    confirmPassword: string;
}, {
    loginId: string;
    email: string;
    fullName: string;
    password: string;
    confirmPassword: string;
}>;
export declare const loginSchema: z.ZodObject<{
    loginId: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    loginId: string;
    password: string;
}, {
    loginId: string;
    password: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const verifyOtpSchema: z.ZodObject<{
    email: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    otp: string;
}, {
    email: string;
    otp: string;
}>;
export declare const resetPasswordSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodString;
    otp: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    confirmPassword: string;
    otp: string;
}, {
    email: string;
    password: string;
    confirmPassword: string;
    otp: string;
}>, {
    email: string;
    password: string;
    confirmPassword: string;
    otp: string;
}, {
    email: string;
    password: string;
    confirmPassword: string;
    otp: string;
}>;
export declare const warehouseSchema: z.ZodObject<{
    name: z.ZodString;
    shortCode: z.ZodString;
    address: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    shortCode: string;
    address?: string | undefined;
}, {
    name: string;
    shortCode: string;
    address?: string | undefined;
}>;
export declare const locationSchema: z.ZodObject<{
    name: z.ZodString;
    shortCode: z.ZodString;
    warehouseId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    type: z.ZodDefault<z.ZodEnum<["INTERNAL", "VENDOR", "CUSTOMER", "ADJUSTMENT"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "INTERNAL" | "ADJUSTMENT" | "VENDOR" | "CUSTOMER";
    shortCode: string;
    warehouseId?: string | null | undefined;
}, {
    name: string;
    shortCode: string;
    type?: "INTERNAL" | "ADJUSTMENT" | "VENDOR" | "CUSTOMER" | undefined;
    warehouseId?: string | null | undefined;
}>;
export declare const contactSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["VENDOR", "CUSTOMER", "BOTH"]>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "VENDOR" | "CUSTOMER" | "BOTH";
    email?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
}, {
    name: string;
    type: "VENDOR" | "CUSTOMER" | "BOTH";
    email?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
}>;
export declare const categorySchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const productSchema: z.ZodObject<{
    name: z.ZodString;
    sku: z.ZodString;
    categoryId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    uom: z.ZodEnum<["Units", "kg", "m", "L", "Box"]>;
    unitCost: z.ZodNumber;
    initialQty: z.ZodOptional<z.ZodNumber>;
    initialLocationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    sku: string;
    uom: "m" | "Units" | "kg" | "L" | "Box";
    unitCost: number;
    categoryId?: string | null | undefined;
    initialQty?: number | undefined;
    initialLocationId?: string | null | undefined;
}, {
    name: string;
    sku: string;
    uom: "m" | "Units" | "kg" | "L" | "Box";
    unitCost: number;
    categoryId?: string | null | undefined;
    initialQty?: number | undefined;
    initialLocationId?: string | null | undefined;
}>;
export declare const reorderRuleSchema: z.ZodObject<{
    productId: z.ZodString;
    warehouseId: z.ZodString;
    minQty: z.ZodNumber;
    maxQty: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    warehouseId: string;
    productId: string;
    minQty: number;
    maxQty: number;
}, {
    warehouseId: string;
    productId: string;
    minQty: number;
    maxQty: number;
}>;
export declare const operationLineSchema: z.ZodObject<{
    productId: z.ZodString;
    quantity: z.ZodNumber;
    countedQuantity: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
    countedQuantity?: number | undefined;
}, {
    productId: string;
    quantity: number;
    countedQuantity?: number | undefined;
}>;
export declare const createOperationSchema: z.ZodObject<{
    type: z.ZodEnum<["RECEIPT", "DELIVERY", "INTERNAL", "ADJUSTMENT"]>;
    warehouseId: z.ZodString;
    sourceLocationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    destLocationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    contactId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    deliveryAddress: z.ZodOptional<z.ZodString>;
    operationTypeNote: z.ZodOptional<z.ZodString>;
    scheduleDate: z.ZodString;
    responsibleId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    lines: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
        countedQuantity: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
        countedQuantity?: number | undefined;
    }, {
        productId: string;
        quantity: number;
        countedQuantity?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "RECEIPT" | "DELIVERY" | "INTERNAL" | "ADJUSTMENT";
    warehouseId: string;
    scheduleDate: string;
    lines: {
        productId: string;
        quantity: number;
        countedQuantity?: number | undefined;
    }[];
    sourceLocationId?: string | null | undefined;
    destLocationId?: string | null | undefined;
    contactId?: string | null | undefined;
    deliveryAddress?: string | undefined;
    operationTypeNote?: string | undefined;
    responsibleId?: string | null | undefined;
}, {
    type: "RECEIPT" | "DELIVERY" | "INTERNAL" | "ADJUSTMENT";
    warehouseId: string;
    scheduleDate: string;
    lines: {
        productId: string;
        quantity: number;
        countedQuantity?: number | undefined;
    }[];
    sourceLocationId?: string | null | undefined;
    destLocationId?: string | null | undefined;
    contactId?: string | null | undefined;
    deliveryAddress?: string | undefined;
    operationTypeNote?: string | undefined;
    responsibleId?: string | null | undefined;
}>;
export declare const updateOperationSchema: z.ZodObject<Omit<{
    type: z.ZodOptional<z.ZodEnum<["RECEIPT", "DELIVERY", "INTERNAL", "ADJUSTMENT"]>>;
    warehouseId: z.ZodOptional<z.ZodString>;
    sourceLocationId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    destLocationId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    contactId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    deliveryAddress: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    operationTypeNote: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    scheduleDate: z.ZodOptional<z.ZodString>;
    responsibleId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    lines: z.ZodOptional<z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
        countedQuantity: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
        countedQuantity?: number | undefined;
    }, {
        productId: string;
        quantity: number;
        countedQuantity?: number | undefined;
    }>, "many">>;
}, "type">, "strip", z.ZodTypeAny, {
    warehouseId?: string | undefined;
    sourceLocationId?: string | null | undefined;
    destLocationId?: string | null | undefined;
    contactId?: string | null | undefined;
    deliveryAddress?: string | undefined;
    operationTypeNote?: string | undefined;
    scheduleDate?: string | undefined;
    responsibleId?: string | null | undefined;
    lines?: {
        productId: string;
        quantity: number;
        countedQuantity?: number | undefined;
    }[] | undefined;
}, {
    warehouseId?: string | undefined;
    sourceLocationId?: string | null | undefined;
    destLocationId?: string | null | undefined;
    contactId?: string | null | undefined;
    deliveryAddress?: string | undefined;
    operationTypeNote?: string | undefined;
    scheduleDate?: string | undefined;
    responsibleId?: string | null | undefined;
    lines?: {
        productId: string;
        quantity: number;
        countedQuantity?: number | undefined;
    }[] | undefined;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    fullName: z.ZodString;
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    fullName: string;
}, {
    email: string;
    fullName: string;
}>;
export declare const changePasswordSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}>, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}>;
export declare const stockUpdateSchema: z.ZodObject<{
    productId: z.ZodString;
    locationId: z.ZodString;
    newQuantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    productId: string;
    locationId: string;
    newQuantity: number;
}, {
    productId: string;
    locationId: string;
    newQuantity: number;
}>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type WarehouseInput = z.infer<typeof warehouseSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ReorderRuleInput = z.infer<typeof reorderRuleSchema>;
export type OperationLineInput = z.infer<typeof operationLineSchema>;
export type CreateOperationInput = z.infer<typeof createOperationSchema>;
export type UpdateOperationInput = z.infer<typeof updateOperationSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type StockUpdateInput = z.infer<typeof stockUpdateSchema>;
export type UserRole = 'MANAGER' | 'STAFF';
export type LocationType = 'INTERNAL' | 'VENDOR' | 'CUSTOMER' | 'ADJUSTMENT';
export type ContactType = 'VENDOR' | 'CUSTOMER' | 'BOTH';
export type UoM = 'Units' | 'kg' | 'm' | 'L' | 'Box';
export type OperationType = 'RECEIPT' | 'DELIVERY' | 'INTERNAL' | 'ADJUSTMENT';
export type OperationStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELLED';
export type MoveDirection = 'IN' | 'OUT' | 'INTERNAL' | 'ADJUSTMENT';
export interface ApiError {
    error: {
        code: string;
        message: string;
        fields?: Record<string, string[]>;
    };
}

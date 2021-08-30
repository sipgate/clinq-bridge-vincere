export const sanitizePhonenumber = (phone: string) => phone.replace(/[^\+0-9]*/g, "");

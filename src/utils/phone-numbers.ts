import { PhoneNumberFormat, PhoneNumberUtil } from "google-libphonenumber";

const phoneUtil = PhoneNumberUtil.getInstance();

export const parsePhoneNumber = (phoneNumber: string) => {
    try {
        return {
            e164: phoneUtil.format(phoneUtil.parse(`${phoneNumber}`), PhoneNumberFormat.E164),
            localized: phoneUtil.format(phoneUtil.parse(`${phoneNumber}`), PhoneNumberFormat.NATIONAL)
        };
    } catch (error) {
        return { e164: phoneNumber, localized: phoneNumber };
    }
};

export const normalizePhoneNumber = (phoneNumber: string) => phoneNumber.replace(/\D/g, "");

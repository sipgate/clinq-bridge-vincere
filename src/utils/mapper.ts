import { PhoneNumber, PhoneNumberLabel, Contact } from "@clinq/bridge";


const sanitizePhonenumber = (phone: string) => phone.replace(/[^\+0-9]*/g, "");

export const mapVincereContactToClinqContact = (vincereContactItem: any) => {
  const phoneNumbers: PhoneNumber[] = [];
  if (vincereContactItem.phone) {
    phoneNumbers.push({
      label: PhoneNumberLabel.WORK,
      phoneNumber: sanitizePhonenumber(vincereContactItem.phone[0]),
    });
  }
  if (vincereContactItem.mobile) {
    phoneNumbers.push({
      label: PhoneNumberLabel.MOBILE,
      phoneNumber: sanitizePhonenumber(vincereContactItem.mobile[0]),
    });
  }
  const contact: Contact = {
    id: `${vincereContactItem.id}`,
    email: vincereContactItem.email ? vincereContactItem.email[0] : null,
    name: vincereContactItem.name ? vincereContactItem.name : null,
    firstName: vincereContactItem.name
      ? vincereContactItem.name.split(" ")[0]
      : null,
    lastName: vincereContactItem.name
      ? vincereContactItem.name
          .split(" ")
          .slice(1, vincereContactItem.name.split(" ").length)
          .join(" ")
      : null,
    organization: vincereContactItem.company
      ? vincereContactItem.company.name
        ? vincereContactItem.company.name
        : null
      : null,
    contactUrl: "",
    avatarUrl: "",
    phoneNumbers,
  };
  return contact;
};

export const mapVincereCandidateToClinqContact = (vincereCandidateItem: any) => {
  const phoneNumbers: PhoneNumber[] = [];
  if (vincereCandidateItem.phone) {
    phoneNumbers.push({
      label: PhoneNumberLabel.WORK,
      phoneNumber: sanitizePhonenumber(vincereCandidateItem.phone),
    });
  }
  if (vincereCandidateItem.mobile) {
    phoneNumbers.push({
      label: PhoneNumberLabel.MOBILE,
      phoneNumber: sanitizePhonenumber(vincereCandidateItem.mobile),
    });
  }
  const contact: Contact = {
    id: `${vincereCandidateItem.id}`,
    email: vincereCandidateItem.primary_email ? vincereCandidateItem.primary_email : null,
    name: vincereCandidateItem.name ? vincereCandidateItem.name : null,
    firstName: vincereCandidateItem.name
        ? vincereCandidateItem.name.split(" ")[0]
        : null,
    lastName: vincereCandidateItem.name
        ? vincereCandidateItem.name
            .split(" ")
            .slice(1, vincereCandidateItem.name.split(" ").length)
            .join(" ")
        : null,
    organization: null,
    contactUrl: "",
    avatarUrl: "",
    phoneNumbers,
  };
  return contact;
};


import {CallDirection, CallEvent, Contact, PhoneNumber, PhoneNumberLabel} from "@clinq/bridge";
import * as moment from "moment";
import {sanitizePhonenumber} from "./phone-numbers";

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

export const mapCallEventToDescription = (callEvent: CallEvent) => {
  let description: string = "";
  // successfully connected
  if (callEvent.start && callEvent.end && callEvent.start !== callEvent.end) {
    if (callEvent.direction === CallDirection.IN) {
      description += `Called me on ${callEvent.to} from ${callEvent.from}`;
    } else {
      description += `I called him/her on ${callEvent.to} from ${callEvent.from}`;
    }
    description += ` from ${(moment.utc(new Date(callEvent.start))).local().format('YYYY-MM-DD HH:mm:ss')}`;
    description += ` to ${(moment.utc(new Date(callEvent.end))).local().format('YYYY-MM-DD HH:mm:ss')}`;
  }
  // missed call
  else  {
    if (callEvent.direction === CallDirection.IN) {
      description += `Tried to called me from ${callEvent.from} on ${callEvent.to}`;
    } else {
      description += `I tried to call him/her on ${callEvent.to} from ${callEvent.from}`;
    }
  }
  return description;
}

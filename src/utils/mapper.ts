import {CallDirection, CallEvent, Contact, PhoneNumber, PhoneNumberLabel} from "@clinq/bridge";
import * as moment from "moment";
import {sanitizePhonenumber} from "./phone-numbers";

export const mapVincereContactToClinqContact = (vincereContactItem: any) => {
  const phoneNumbers: PhoneNumber[] = [];
  // vincere primary number -> clinq work number
  if (vincereContactItem.phone) {
    phoneNumbers.push({
      label: PhoneNumberLabel.WORK,
      phoneNumber: sanitizePhonenumber(vincereContactItem.phone),
    });
  }
  // vincere mobile number -> clinq mobile number
  if (vincereContactItem.mobile_phone) {
    phoneNumbers.push({
      label: PhoneNumberLabel.MOBILE,
      phoneNumber: sanitizePhonenumber(vincereContactItem.mobile_phone),
    });
  }
  // vincere home number -> clinq mobile number
  if (vincereContactItem.home_phone) {
    phoneNumbers.push({
      label: PhoneNumberLabel.HOME,
      phoneNumber: sanitizePhonenumber(vincereContactItem.home_phone),
    });
  }
  const firstName: string = vincereContactItem.first_name ? vincereContactItem.first_name.trim(): '';
  const lastName: string = vincereContactItem.last_name ? vincereContactItem.last_name.trim(): '';
  const name: string = (firstName + ' ' + lastName).trim();
  const contact: Contact = {
    id: `${vincereContactItem.id}`,
    email: vincereContactItem.email ? vincereContactItem.email : null,
    name: name ? name : null,
    firstName: vincereContactItem.first_name ? vincereContactItem.first_name: null,
    lastName: vincereContactItem.last_name ? vincereContactItem.last_name: null,
    organization: null,
    contactUrl: "",
    avatarUrl: "",
    phoneNumbers,
  };
  return contact;
};

export const mapVincereCandidateToClinqContact = (vincereCandidateItem: any) => {
  const phoneNumbers: PhoneNumber[] = [];
  if (vincereCandidateItem.phone || (!vincereCandidateItem.phone && vincereCandidateItem.home_phone)) {
    const phoneNumber: string = vincereCandidateItem.phone?vincereCandidateItem.phone:vincereCandidateItem.home_phone;
    phoneNumbers.push({
      label: PhoneNumberLabel.HOME,
      phoneNumber: sanitizePhonenumber(phoneNumber),
    });
  }
  if (vincereCandidateItem.work_phone || (!vincereCandidateItem.work_phone && vincereCandidateItem.home_phone)) {
    const phoneNumber: string = vincereCandidateItem.work_phone?vincereCandidateItem.work_phone:vincereCandidateItem.home_phone;
    phoneNumbers.push({
      label: PhoneNumberLabel.WORK,
      phoneNumber: sanitizePhonenumber(phoneNumber),
    });
  }
  if (vincereCandidateItem.mobile || (!vincereCandidateItem.mobile && vincereCandidateItem.home_phone)) {
    const phoneNumber: string = vincereCandidateItem.mobile?vincereCandidateItem.mobile:vincereCandidateItem.home_phone;
    phoneNumbers.push({
      label: PhoneNumberLabel.MOBILE,
      phoneNumber: sanitizePhonenumber(phoneNumber),
    });
  }
  const firstName: string = vincereCandidateItem.first_name ? vincereCandidateItem.first_name.trim(): '';
  const lastName: string = vincereCandidateItem.last_name ? vincereCandidateItem.last_name.trim(): '';
  const name: string = (firstName + ' ' + lastName).trim();
  const contact: Contact = {
    id: `${vincereCandidateItem.id}`,
    email: vincereCandidateItem.email ? vincereCandidateItem.email : null,
    name: name ? name: null,
    firstName: vincereCandidateItem.first_name ? vincereCandidateItem.first_name: null,
    lastName: vincereCandidateItem.last_name ? vincereCandidateItem.last_name : null,
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

import { gql } from "@apollo/client";
const REGISTER = gql`
  mutation Register($email: String!, $password: String!, $fullname: String!, $dialing_code: String!, $phone: String!, $locale: String!) {
    createUser(createUserInput: { email: $email, password: $password, fullname: $fullname, dialing_code: $dialing_code, phone: $phone, locale: $locale }) {
      _id
      email
      fullname
      dialing_code
      phone
      locale
    }
  }
`;
const UPDATE_ACCOUNT = gql`
  mutation UpdateAccount($id: String!, $email: String!, $fullname: String!, $dialing_code: String!, $phone: String!) {
    updateAccount(updateUserInput: { id: $id, email: $email, fullname: $fullname, dialing_code: $dialing_code, phone: $phone }) {
      _id
      email
      fullname
      dialing_code
      phone
      locale
    }
  }
`;
const LOGIN = gql`
  mutation Login($email_phone: String!, $password: String!) {
    login(email_phone: $email_phone, password: $password) {
      _id
      fullname
      dialing_code
      email
      phone
      locale
      token
    }
  }
`;
const LOGIN_IN_BY_EMAIL = gql`
  mutation LoginByEmail($email: String!) {
    loginByEmail(email: $email) {
      _id
      fullname
      dialing_code
      email
      phone
      locale
      token
    }
  }
`;
const LOGOUT = gql`
  mutation Logout($id: String!) {
    logout(id: $id) {
      _id
      fullname
      dialing_code
      email
      phone
      locale
      token
    }
  }
`;
const CHECK_VALID_TOKEN = gql`
  mutation CheckValidToken($token: String!) {
    checkValidToken(token: $token) {
      _id
      fullname
      email
      phone
      locale
      token
    }
  }
`;
const USER_BY_OLD_PASSWORD = gql`
  mutation GetUserByOldPassword($id: String!, $old_password: String!) {
    getUserByOldPassword(id: $id, old_password: $old_password) {
      _id
      fullname
      email
      phone
      locale
    }
  }
`;
const CHANGE_PASSWORD = gql`
  mutation ChangePassword($id: String!, $new_password: String!) {
    changePassword(id: $id, new_password: $new_password) {
      _id
      fullname
      email
      phone
      locale
    }
  }
`;
const RESET_PASSWORD = gql`
  mutation ResetPassword($email: String!, $new_password: String!) {
    resetPassword(email: $email, new_password: $new_password) {
      _id
      fullname
      email
      phone
      locale
    }
  }
`;
const GET_USERS_BY_EMAIL = gql`
  query GetUsersByEmail($email: String!) {
    getUsersByEmail(email: $email) {
      _id
      email
      fullname
      dialing_code
      phone
      locale
    }
  }
`;
const GET_USERS_BY_PHONE = gql`
  query GetUsersByPhone($phone: String!) {
    getUsersByPhone(phone: $phone) {
      _id
      email
      fullname
      dialing_code
      phone
      locale
    }
  }
`;
const SEND_EMAIL_USER = gql`
  mutation SendEmailUser($email: String!, $otp: String!) {
    sendEmailUser(email: $email, otp: $otp) {
      _id
      email
      fullname
      dialing_code
      phone
      locale
    }
  }
`;
const SEND_EMAIL_FOR_PASSWORD = gql`
  mutation SendEmailForPassword($email: String!, $password: String!) {
    sendEmailForPassword(email: $email, password: $password) {
      _id
      email
      fullname
      dialing_code
      phone
      locale
    }
  }
`;
const GET_USER_DETAIL = gql`
  query GetUserDetail {
    account {
      _id
      email
      fullname
      dialing_code
      phone
    }
  }
`;
const USERS_BY_EMAIL_AND_ID = gql`
  mutation UsersByEmailAndId($id: String!, $email: String!) {
    listUsersByEmailAndId(id: $id, email: $email) {
      _id
      email
      fullname
      dialing_code
      phone
    }
  }
`;
const USERS_BY_PHONE_AND_ID = gql`
  mutation UsersByPhoneAndId($id: String!, $phone: String!) {
    listUsersByPhoneAndId(id: $id, phone: $phone) {
      _id
      email
      fullname
      dialing_code
      phone
    }
  }
`;
const UPDATE_USER_LOCALE = gql`
  mutation UpdateUserLocale($id: String!, $locale: String!) {
    updateUserLocale(id: $id, locale: $locale) {
      _id
      email
      fullname
      dialing_code
      phone
      locale
    }
  }
`;
export {
  REGISTER,
  LOGIN,
  LOGOUT,
  CHECK_VALID_TOKEN,
  USER_BY_OLD_PASSWORD,
  CHANGE_PASSWORD,
  GET_USERS_BY_EMAIL,
  SEND_EMAIL_USER,
  GET_USERS_BY_PHONE,
  RESET_PASSWORD,
  SEND_EMAIL_FOR_PASSWORD,
  GET_USER_DETAIL,
  UPDATE_ACCOUNT,
  USERS_BY_EMAIL_AND_ID,
  USERS_BY_PHONE_AND_ID,
  UPDATE_USER_LOCALE,
  LOGIN_IN_BY_EMAIL
};

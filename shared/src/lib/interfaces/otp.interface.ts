export interface RequestOtpRequest {
    phone: string;
}

export interface RequestOtpResponse {
    message: string;
}

export interface VerifyOtpRequest {
    phone: string;
    code: string;
}

export interface VerifyOtpResponse {
    message: string;
    verificationToken: string;
}

import { apiFetch } from "./client";

export interface User {
    id: number;
    email: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string;
    role: string;
    created_at: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginParams {
    email: string;
    password: string;
}

export interface SignupParams {
    email: string;
    password: string;
    password_confirmation: string;
    first_name?: string;
    last_name?: string;
}

export async function loginApi(params: LoginParams): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(params),
    });
}

export async function signupApi(params: SignupParams): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ user: params }),
    });
}

export async function fetchMeApi(): Promise<{ user: User }> {
    return apiFetch<{ user: User }>("/auth/me", {
        method: "GET",
    });
}

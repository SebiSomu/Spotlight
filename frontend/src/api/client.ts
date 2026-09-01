const API_BASE_URL = "http://localhost:3000/api/v1";

export async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const token = localStorage.getItem("spotlight_token");

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        const errorMessage =
            data.errors?.join(", ") ||
            data.error ||
            "Something went wrong. Please try again.";
        throw new Error(errorMessage);
    }

    return data as T;
}

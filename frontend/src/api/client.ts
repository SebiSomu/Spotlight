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

    const contentType = response.headers.get("content-type");
    let data: any = null;

    if (contentType && contentType.includes("application/json")) {
        try {
            data = await response.json();
        } catch {
            data = null;
        }
    }

    if (!response.ok) {
        const errorMessage =
            data?.errors?.join(", ") ||
            data?.error ||
            `Server returned HTTP ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
    }

    if (data === null) {
        throw new Error("Server returned an invalid non-JSON response.");
    }

    return data as T;
}

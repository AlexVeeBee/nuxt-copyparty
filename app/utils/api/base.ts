import type { Locales } from "../types";

interface ApiResponse<TData> extends Promise<TData> {
    code?: string;
    message?: string;
    error?: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
    };
}


type RequestParams = Record< "locale" | string, any>;

export default class ApiBase {
    private baseUrl: string;
    private headers: Record<string, string>;

    
    constructor(baseUrl: string = 'http://localhost:3923') {
        this.baseUrl = baseUrl;
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
    }

    setHeaders(headers: Record<string, string>) {
        this.headers = { ...this.headers, ...headers };
    }
    emptyHeaders() {
        this.headers = {};
    }

    getBaseUrl(): string {
        return this.baseUrl;
    }

    async $fetch<T>(url: string, options: {
        headers?: Record<string, string>;
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
        params?: RequestParams;
        body?: any;
        opts?: {
            useAuth?: boolean;
            authMode?: 'header' | 'cookie';
            errorNoAuth?: boolean;
        };
        fetchOpts?: {
            ignoreResponseError?: boolean;
        };
    } = {}): Promise<ApiResponse<T>> {
        const login = options.opts?.useAuth ? cookie.get("login") : null;
        if (options.opts?.useAuth && !login) {
            !options.opts.errorNoAuth
            ? console.warn('No login cookie found, authentication will not be applied.') :
            (() => { throw new Error('No login cookie found, authentication is required for this request.'); })();
        }

        const response = await $fetch<ApiResponse<T>>(`${this.baseUrl}${url}`, {
            ...options.fetchOpts,
            method: options.method,
            params: options.params,
            headers: {
                ...this.headers,
                ...options.headers,
                ...(login ? { 'Authorization': `Bearer ${login}` } : {}),
            },
            body: options.body,
        });

        if (!response) {
            throw new Error('Empty response from API');
        }

        return response;
    }

    async useFetch<T>(url: string, options: {
        headers?: Record<string, string>;
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
        params?: RequestParams;
        body?: any;
        opts?: {};
        fetchOpts?: {
            ignoreResponseError?: boolean;
        };
    } = {}) {
        return await useFetch<ApiResponse<T|null>>(`${this.baseUrl}${url}`, {
            method: options.method || 'GET',
            params: options.params,
            headers: {
                ...this.headers,
                ...options.headers,
            },
            body: options.body,
            ...options.fetchOpts,
        });
    }

    async xhr<T>(url: string, options: {
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
        body?: any;
        headers?: Record<string, string>;
        params?: Record<string, any>;
        opts?: {
            useAuth?: boolean;
            authMode?: 'header' | 'cookie';
            errorNoAuth?: boolean;
        };
    } = {}): Promise<ApiResponse<T>> {
        const login = options.opts?.useAuth ? cookie.get("login") : null;
        if (options.opts?.useAuth && !login) {
            !options.opts.errorNoAuth
            ? console.warn('No login cookie found, authentication will not be applied.') :
            (() => { throw new Error('No login cookie found, authentication is required for this request.'); })();
        }
        const completeUrl = `${this.baseUrl}${url}`;
        const xhr = new XMLHttpRequest();
        xhr.open(options.method || 'GET', completeUrl);
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader('Content-Type', 'multipart/form-data');
        if (login) {
            xhr.setRequestHeader('Authorization', `Bearer ${login}`);
        }
        if (options.headers) {
            Object.entries(options.headers).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value);
            });
        }

        return new Promise((resolve, reject) => {
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error(`[${options.method}] ${completeUrl} (${xhr.status}): ${xhr.statusText}`));
                }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(options.body);
        });
    }

    getAuthHeaders(): Record<string, string> {
        const login = cookie.get("login");
        if (!login) {
            throw new Error('No login cookie found, authentication is required for this request.');
        }
        return {
            'Authorization': `Bearer ${login}`,
            ...this.headers,
        };
    }
}
import { isDev } from "./conf";

interface setOptions {
    /**
     * Number of days until the cookie expires
     */
    expires: number;
    /**
     * Path of the cookie
     */
    path?: string;
    /**
     * SameSite attribute of the cookie
     * @default "strict"
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite
     */
    sameSite?: "strict" | "lax" | "none";
    /**
     * Whether the cookie is HTTP only
     * @default true
     * @see https://developer.mozilla.org/en-US/search?q=HttpOnly
     */
    httpOnly?: boolean;
    /**
     * Whether the cookie is only sent over HTTPS
     * @default true
     * @see https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies
     */
    secure?: boolean; // Whether the cookie is only sent over HTTPS
}

const cookie = {
    set(name: string, value: string, opts: setOptions = {
        expires: 7, // Default to 7 days
        sameSite: "lax", // Default to lax
        path: "/",
        secure: !isDev
    }) {
        useCookie(name, { 
            maxAge: opts.expires ? opts.expires * 24 * 60 * 60 : undefined,
            path: opts.path || "/",
            sameSite: opts.sameSite,
            httpOnly: opts.httpOnly,
            secure: opts.secure,
        }).value = value;
    },
    get(name: string, opts: { path?: string } = {}): string | null {
        const c = useCookie(name, {
            path: opts.path || "/"
        }).value;
        if (!c) return null;
        try {
            return decodeURIComponent(c);
        } catch (e) {
            console.error("Failed to decode cookie:", e);
        }
        return c;
    },
    remove(name: string) {
        useCookie(name).value = null;
    }
}

export default cookie;
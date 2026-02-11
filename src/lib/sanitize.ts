import xss from "xss";

export function sanitize(val: string) {
    if (typeof val !== 'string') return "";
    return xss(val);
}

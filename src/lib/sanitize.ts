import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window as unknown as any);

export function sanitize(val: string) {
    if (typeof val !== 'string') return "";
    return DOMPurify.sanitize(val.trim());
}

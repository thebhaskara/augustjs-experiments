
const randomString = () => `_a${Math.random().toString(36).substring(2)}`;

export const WATCH = randomString()
export const INJECT = randomString()
export const CHANGE = randomString()
export const OPTIONAL = randomString()

export const INTERNAL_PATH = randomString();
export const RENDERED_PATH = [INTERNAL_PATH, randomString()].join('.');
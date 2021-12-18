// for a class type, it is observed that the constructor and prototype exist
// additionally constructor is a function
export function isClass(obj) {
    return obj.constructor && obj.prototype && obj.constructor.toString().startsWith("function")
}
// for an instance type, it is observed that the constructor exists but prototype does not exist
// additionally constructor is a class
export function isInstance(obj) {
    return obj.constructor && !obj.prototype && obj.constructor.toString().startsWith("class")
}

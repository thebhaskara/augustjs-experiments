// for a class type, it is observed that the constructor and prototype exist
// additionally constructor is a function
// this passes for functions also, 
// as they were the fundamental blocks to create classes in javascript in the first place 
// this is based on observations of the object.
// So, please update this as necessary
export function isClass(obj) {
    return obj.constructor && obj.prototype && obj.constructor.toString().startsWith("function")
}
// for an instance type, it is observed that the constructor exists but prototype does not exist
// additionally constructor is a class
// this is based on observations of the object.
// So, please update this as necessary
export function isInstance(obj) {
    return obj.constructor && !obj.prototype && obj.constructor.toString().startsWith("class")
}

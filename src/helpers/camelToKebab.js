export default (string) => {
    if (!string || !string.replace) return string;
    return string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
};
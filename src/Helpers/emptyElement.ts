// this will empty the contents of a HTML Element
export const emptyElement = (container: Element) => {
    while (container.firstChild) container.removeChild(container.firstChild)
}

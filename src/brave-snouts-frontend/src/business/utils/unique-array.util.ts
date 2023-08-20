export const uniqueArray = <T>(arr: T[]): T[] => {
    const json = arr.map(x => JSON.stringify(x));
    const unique = new Set(json);
    const uniqueItems = [...unique.values()].map(x => JSON.parse(x) as T);
    return uniqueItems;
};
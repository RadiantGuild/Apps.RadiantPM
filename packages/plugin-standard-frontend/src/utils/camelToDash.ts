const regex = /([a-z])([A-Z])/g;

export default function camelToDash(camel: string): string {
    return camel.replace(regex, (_, a, b) => `${a}-${b}`).toLowerCase();
}

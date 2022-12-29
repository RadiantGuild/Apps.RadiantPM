export default function modulo(n: number, m: number): number {
    return ((n % m) + m) % m;
}

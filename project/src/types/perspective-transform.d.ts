declare module 'perspective-transform' {
    export default function PerspT(
        srcPts: [number, number, number, number, number, number, number, number] | number[],
        dstPts: [number, number, number, number, number, number, number, number] | number[]
    ): {
        transform: (x: number, y: number) => [number, number];
        transformInverse: (x: number, y: number) => [number, number];
        srcPts: [number, number, number, number, number, number, number, number];
        dstPts: [number, number, number, number, number, number, number, number];
        coeffs: number[];
        coeffsInv: number[];
    };
}

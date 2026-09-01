import { useMemo } from "react";

interface TicketQRCodeProps {
    code: string;
    size?: number;
    className?: string;
}

// Generate a deterministic 21x21 QR code matrix based on string code
function generateQRMatrix(code: string): boolean[][] {
    const size = 21;
    const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

    // Simple hash function for pseudo-random data bits
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
        hash = (hash << 5) - hash + code.charCodeAt(i);
        hash |= 0;
    }

    // Fill finder patterns (top-left, top-right, bottom-left 7x7 squares)
    const addFinder = (startRow: number, startCol: number) => {
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
                const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
                matrix[startRow + r][startCol + c] = isBorder || isCenter;
            }
        }
    };

    addFinder(0, 0);
    addFinder(0, 14);
    addFinder(14, 0);

    // Fill timing patterns (row 6 and col 6)
    for (let i = 8; i < 13; i++) {
        matrix[6][i] = i % 2 === 0;
        matrix[i][6] = i % 2 === 0;
    }

    // Fill pseudo-random data pixels based on code hash
    let bitIdx = 0;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            // Skip finder patterns & timing lines
            if (
                (r < 8 && c < 8) ||
                (r < 8 && c > 12) ||
                (r > 12 && c < 8) ||
                r === 6 ||
                c === 6
            ) {
                continue;
            }

            // Pseudo-random deterministic bit
            const bit = ((hash >> (bitIdx % 31)) & 1) === 1;
            matrix[r][c] = bit;
            hash = (hash * 1664525 + 1013904223) | 0;
            bitIdx++;
        }
    }

    return matrix;
}

export default function TicketQRCode({ code, size = 120, className = "" }: TicketQRCodeProps) {
    const matrix = useMemo(() => generateQRMatrix(code), [code]);

    const cellSize = 100 / 21;

    return (
        <div
            className={`relative p-2 bg-[#0d0d15] border border-gold/30 rounded-xl shadow-lg inline-flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
            id={`qr-container-${code}`}
        >
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
                shapeRendering="crispEdges"
            >
                {/* Background */}
                <rect width="100" height="100" fill="#0d0d15" rx="4" />

                {/* Render QR Modules */}
                {matrix.map((row, r) =>
                    row.map((cell, c) => {
                        if (!cell) return null;
                        const isFinder =
                            (r < 7 && c < 7) ||
                            (r < 7 && c >= 14) ||
                            (r >= 14 && c < 7);

                        return (
                            <rect
                                key={`${r}-${c}`}
                                x={c * cellSize}
                                y={r * cellSize}
                                width={cellSize + 0.1}
                                height={cellSize + 0.1}
                                fill={isFinder ? "#f5c842" : "#e8a838"}
                                rx={isFinder ? 0.3 : 0.2}
                            />
                        );
                    })
                )}
            </svg>
        </div>
    );
}

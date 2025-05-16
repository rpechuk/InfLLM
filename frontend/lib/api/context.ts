const CONTEXT_API_URL = process.env.NEXT_PUBLIC_CONTEXT_API_URL || "http://localhost:8000/context";

// Context Manager API
export async function getLayerContext(layer: number) {
    const res = await fetch(`${CONTEXT_API_URL}/layer/${layer}`);
    if (!res.ok) throw new Error(`Failed to fetch layer context for layer ${layer}`);
    return res.json();
}

export async function getBlockContext(layer: number, block: number) {
    const res = await fetch(`${CONTEXT_API_URL}/block/${layer}/${block}`);
    if (!res.ok) throw new Error(`Failed to fetch block context for layer ${layer}, block ${block}`);
    return res.json();
} 
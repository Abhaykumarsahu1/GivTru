// IPFS helpers.
//
// Uploads no longer use any secret in the browser. The flow is:
//   1. ask our own serverless function (/api/upload-url) for a one-time upload URL
//      (it holds the Pinata credentials, expires in 60 s, accepts images <= 10 MB)
//   2. upload the file straight to Pinata with that URL
//
// Nothing here may read a Pinata key. Do not add VITE_PINATA_* variables back.

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // keep in sync with api/upload-url.js

// ─────────────────────────────────────────
//  Upload IMAGE to IPFS via a signed URL
// ─────────────────────────────────────────

export const uploadImageToIPFS = async (file) => {
    if (!file || !file.type?.startsWith("image/")) {
        throw new Error("Please choose an image file.");
    }
    if (file.size > MAX_IMAGE_BYTES) {
        throw new Error("The image must be under 10 MB.");
    }

    try {
        // 1. get a short-lived upload URL from our own backend function
        const res = await fetch("/api/upload-url", { method: "POST" });
        if (!res.ok) throw new Error(`Upload URL request failed (${res.status})`);
        const { url } = await res.json();
        if (!url) throw new Error("No upload URL returned");

        // 2. upload directly to Pinata (SDK loaded only when an upload happens)
        const { PinataSDK } = await import("pinata");
        const pinata = new PinataSDK({ pinataJwt: "" }); // empty on purpose: the URL carries the authorization
        const upload = await pinata.upload.public.file(file).url(url);

        console.log("Uploaded to IPFS:", upload.cid);
        return upload.cid;
    } catch (err) {
        console.error("IPFS upload error:", err);
        throw new Error("Failed to upload image to IPFS");
    }
};

// ─────────────────────────────────────────
//  Get IPFS image URL from hash
// ─────────────────────────────────────────

export const getIPFSUrl = (hash) => {
    if (!hash || hash === "QmDefaultHash") return null;
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
};
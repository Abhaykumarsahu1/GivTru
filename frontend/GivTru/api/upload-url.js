// Vercel serverless function: frontend/GivTru/api/upload-url.js
//
// Hands the browser a short-lived, single-purpose Pinata upload URL so the
// real Pinata credentials never leave the server.
//
// Required Vercel environment variables (NOT prefixed with VITE_):
//   PINATA_JWT         JWT of a Pinata key scoped to file uploads only
//   ALLOWED_ORIGINS    comma-separated origins allowed to call this, e.g.
//                      https://giv-tru.vercel.app
//
// Requires:  npm install pinata

import { PinataSDK } from "pinata";

const MAX_BYTES = 10 * 1024 * 1024; // keep in sync with the 10 MB limit in the UI
const EXPIRES_SECONDS = 60;

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Only accept calls from our own site (stops casual hotlinking; not a hard guarantee)
    const allowed = (process.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    const origin = req.headers.origin || "";
    if (allowed.length > 0 && !allowed.includes(origin)) {
        return res.status(403).json({ error: "Forbidden" });
    }

    if (!process.env.PINATA_JWT) {
        console.error("PINATA_JWT is not set");
        return res.status(500).json({ error: "Upload service is not configured" });
    }

    try {
        // If the SDK asks for a gateway, add: pinataGateway: process.env.PINATA_GATEWAY
        const pinata = new PinataSDK({ pinataJwt: process.env.PINATA_JWT });

        const url = await pinata.upload.public.createSignedURL({
            expires: EXPIRES_SECONDS,
            mimeTypes: ["image/*"],
            maxFileSize: MAX_BYTES,
        });

        return res.status(200).json({ url });
    } catch (err) {
        console.error("Could not create signed upload URL:", err);
        return res.status(502).json({ error: "Could not create an upload URL" });
    }
}
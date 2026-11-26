import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import { useContract } from "../hooks/useContract";
import { useToast } from "../context/ToastContext";
import { NETWORKS, DEFAULT_CHAIN_ID } from "../contracts/networks";
import { uploadImageToIPFS } from "../utils/ipfs";
import CryptoBackdrop from "../components/CryptoBackdrop";
import TxLink from "../components/TxLink";
import GivTru from "../assets/GivTru.png";

const DEFAULT_IPFS_HASH = "QmDefaultHash"; // placeholder stored when no image is uploaded
const MIN_BOARD = 3;
const MAX_BOARD = 10;
const MAX_IMAGE_MB = 10;
const TITLE_MAX = 80;
const DESC_MAX = 800;
const STEPS = ["Details", "Board", "Review"];

const css = `
.gt-reg { position: relative; min-height: 100vh; overflow: hidden; background: #ffffff; color: var(--text); font-family: var(--font-sans); }

/* header: logo + wallet only */
.gt-reg-head {
    position: relative; z-index: 2;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 14px var(--page-gutter);
    background: #ffffff; border-bottom: 1px solid var(--border);
}
.gt-reg-logo {
    display: flex; align-items: center; gap: 10px;
    background: none; border: none; padding: 0; cursor: pointer;
    font-family: inherit; font-size: 24px; font-weight: 800; color: #16a34a; letter-spacing: -0.01em;
}
.gt-reg-wallet {
    display: flex; align-items: center; gap: 10px;
    padding: 7px 14px; background: #ffffff;
    border: 1px solid var(--border-strong); border-radius: 999px;
    font-size: 13px; font-weight: 600;
}
.gt-reg-wallet.is-bad { border-color: #f59e0b; background: #fffbeb; }
.gt-reg-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }
.gt-reg-wallet.is-bad .gt-reg-dot { background: #f59e0b; }
.gt-reg-mono { font-family: var(--font-mono); color: var(--text-muted); font-weight: 500; }

.gt-reg-main { position: relative; z-index: 1; max-width: 760px; margin: 0 auto; padding: 28px 20px 72px; }
.gt-reg-back {
    display: inline-flex; align-items: center; gap: 8px;
    background: none; border: none; cursor: pointer;
    padding: 8px 14px 8px 8px; margin-bottom: 14px; border-radius: 10px;
    font: inherit; font-size: 14px; font-weight: 600; color: var(--text-muted);
    transition: background 0.15s, color 0.15s;
}
.gt-reg-back:hover { background: var(--surface-alt); color: var(--text); }

.gt-reg-card {
    background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px);
    border: 1px solid var(--border); border-radius: 20px; padding: 36px;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
}
.gt-reg-title { margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.02em; }
.gt-reg-sub { margin: 8px 0 0; font-size: 15px; line-height: 1.6; color: var(--text-muted); }

/* stepper */
.gt-reg-steps { display: flex; align-items: center; margin: 26px 0 28px; }
.gt-reg-step { display: flex; align-items: center; gap: 10px; background: none; border: none; padding: 0; font: inherit; cursor: default; }
.gt-reg-step.is-done { cursor: pointer; }
.gt-reg-step-num {
    width: 30px; height: 30px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
    background: var(--surface-alt); color: var(--text-dim); border: 1px solid var(--border-strong);
    transition: all 0.2s;
}
.gt-reg-step.is-current .gt-reg-step-num { background: #22c55e; color: #052e16; border-color: #22c55e; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2); }
.gt-reg-step.is-done .gt-reg-step-num { background: #16a34a; color: #ffffff; border-color: #16a34a; }
.gt-reg-step-label { font-size: 14px; font-weight: 600; color: var(--text-dim); }
.gt-reg-step.is-current .gt-reg-step-label { color: var(--text); }
.gt-reg-step.is-done .gt-reg-step-label { color: var(--text-muted); }
.gt-reg-step-line { flex: 1; height: 2px; margin: 0 12px; min-width: 16px; background: var(--border); transition: background 0.2s; }
.gt-reg-step-line.is-done { background: #16a34a; }

/* fields */
.gt-reg-form { display: flex; flex-direction: column; gap: 22px; }
.gt-reg-field { display: flex; flex-direction: column; gap: 7px; }
.gt-reg-label-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.gt-reg-label { font-size: 14px; font-weight: 700; }
.gt-reg-opt { font-weight: 500; color: var(--text-dim); }
.gt-reg-count { font-size: 12px; color: var(--text-dim); }
.gt-reg-hint { margin: 0; font-size: 13px; line-height: 1.5; color: var(--text-dim); }
.gt-reg-error { margin: 0; font-size: 13px; color: #b91c1c; }
.gt-reg-input {
    width: 100%; font: inherit; font-size: 15px; padding: 12px 14px;
    color: var(--text); background: #ffffff;
    border: 1px solid var(--border-strong); border-radius: 12px;
    transition: border-color 0.15s, box-shadow 0.15s;
}
.gt-reg-input::placeholder { color: #94a3b8; }
.gt-reg-input:hover { border-color: #94a3b8; }
.gt-reg-input:focus { outline: none; border-color: #22c55e; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18); }
.gt-reg-input.is-error { border-color: #dc2626; box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1); }
textarea.gt-reg-input { resize: vertical; min-height: 130px; line-height: 1.6; }
.gt-reg-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.gt-reg-affix { position: relative; }
.gt-reg-affix .gt-reg-input { padding-right: 76px; }
.gt-reg-affix > span { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 13px; font-weight: 700; color: var(--text-dim); pointer-events: none; }
.gt-reg-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.gt-reg-chip {
    font: inherit; font-size: 12px; font-weight: 600; padding: 5px 12px;
    border-radius: 999px; border: 1px solid var(--border-strong);
    background: #ffffff; color: var(--text-muted); cursor: pointer;
    transition: all 0.15s;
}
.gt-reg-chip:hover { border-color: #22c55e; color: var(--primary-ink); background: #f0fdf4; }

/* image upload */
.gt-reg-drop {
    width: 100%; font: inherit; color: var(--text);
    display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center;
    padding: 28px 20px; cursor: pointer;
    border: 2px dashed var(--border-strong); border-radius: 16px; background: #f8fafc;
    transition: border-color 0.15s, background 0.15s;
}
.gt-reg-drop:hover, .gt-reg-drop.is-drag { border-color: #22c55e; background: #f0fdf4; }
.gt-reg-drop-icon { width: 44px; height: 44px; border-radius: 12px; background: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
.gt-reg-drop strong { font-size: 15px; }
.gt-reg-drop small { font-size: 13px; color: var(--text-dim); }
.gt-reg-preview { position: relative; border-radius: 16px; overflow: hidden; border: 1px solid var(--border); }
.gt-reg-preview img { display: block; width: 100%; max-height: 260px; object-fit: cover; }
.gt-reg-preview-actions { position: absolute; top: 10px; right: 10px; display: flex; gap: 8px; }
.gt-reg-mini {
    font: inherit; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 999px;
    background: rgba(255, 255, 255, 0.95); color: var(--text); border: 1px solid var(--border);
    cursor: pointer; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15);
}
.gt-reg-mini:hover { background: #ffffff; border-color: #22c55e; }

/* board */
.gt-reg-board { display: flex; flex-direction: column; gap: 14px; }
.gt-reg-member { display: flex; align-items: flex-start; gap: 12px; }
.gt-reg-member-num {
    width: 32px; height: 32px; margin-top: 7px; flex-shrink: 0; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--surface-alt); color: var(--text-muted); font-size: 13px; font-weight: 700;
}
.gt-reg-member.is-ok .gt-reg-member-num { background: #dcfce7; color: #15803d; }
.gt-reg-member-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.gt-reg-input-wrap { position: relative; }
.gt-reg-input-wrap .gt-reg-input { padding-right: 44px; font-family: var(--font-mono); font-size: 14px; }
.gt-reg-ok { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: #16a34a; display: flex; }
.gt-reg-remove {
    width: 34px; height: 34px; margin-top: 7px; flex-shrink: 0; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--border-strong); background: #ffffff; color: var(--text-dim); cursor: pointer;
}
.gt-reg-remove:hover { color: #dc2626; border-color: #dc2626; background: #fef2f2; }
.gt-reg-add {
    display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
    padding: 12px; border: 1px dashed #16a34a; border-radius: 12px;
    background: #f0fdf4; color: #15803d; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer;
}
.gt-reg-add:hover { background: #dcfce7; }

/* callouts */
.gt-reg-note {
    display: flex; gap: 12px; padding: 14px 16px; border-radius: 14px;
    font-size: 14px; line-height: 1.6;
    background: #f0fdf4; border: 1px solid #bbf7d0; color: #14532d;
}
.gt-reg-note.is-warn { background: #fffbeb; border-color: #fde68a; color: #78350f; }
.gt-reg-note.is-info { background: #f8fafc; border-color: var(--border); color: var(--text-muted); }
.gt-reg-note svg { flex-shrink: 0; margin-top: 3px; }
.gt-reg-note p { margin: 0; }
.gt-reg-note ul { margin: 0; padding-left: 18px; }
.gt-reg-note .gt-btn { margin-top: 10px; }

/* review */
.gt-reg-review { border: 1px solid var(--border); border-radius: 16px; overflow: hidden; background: #ffffff; }
.gt-reg-review img { display: block; width: 100%; height: 180px; object-fit: cover; }
.gt-reg-review-body { padding: 20px; display: flex; flex-direction: column; gap: 10px; }
.gt-reg-review-title { margin: 0; font-size: 20px; font-weight: 800; }
.gt-reg-review-desc { margin: 0; font-size: 14px; line-height: 1.6; color: var(--text-muted); white-space: pre-wrap; max-height: 160px; overflow: auto; }
.gt-reg-facts { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border); border-top: 1px solid var(--border); }
.gt-reg-fact { background: #ffffff; padding: 14px 20px; display: flex; flex-direction: column; gap: 3px; }
.gt-reg-fact > span { font-size: 12px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.04em; }
.gt-reg-fact strong { font-size: 15px; }
.gt-reg-select { font: inherit; font-size: 15px; font-weight: 700; color: var(--text); border: 1px solid var(--border-strong); border-radius: 8px; padding: 4px 8px; background: #ffffff; cursor: pointer; width: fit-content; }
.gt-reg-select:focus { outline: none; border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2); }
.gt-reg-addrs { padding: 14px 20px 18px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 6px; }
.gt-reg-addrs > span { font-size: 12px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.04em; }
.gt-reg-addr { font-family: var(--font-mono); font-size: 13px; color: var(--text-muted); word-break: break-all; }
.gt-reg-check {
    display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px;
    border: 1px solid var(--border-strong); border-radius: 14px; cursor: pointer;
    font-size: 14px; line-height: 1.5;
}
.gt-reg-check input { margin-top: 3px; width: 18px; height: 18px; accent-color: #16a34a; flex-shrink: 0; }

/* actions */
.gt-reg-actions { display: flex; justify-content: space-between; gap: 12px; }
.gt-reg-actions .gt-btn { padding: 13px 24px; font-size: 15px; border-radius: 12px; }
.gt-reg-actions .gt-btn-primary { flex: 1; }

/* success */
.gt-reg-done { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px; padding: 12px 0; }
.gt-reg-done-icon { width: 72px; height: 72px; border-radius: 50%; background: #dcfce7; color: #16a34a; display: flex; align-items: center; justify-content: center; }
.gt-reg-done h2 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.01em; }
.gt-reg-done p { margin: 0; max-width: 460px; color: var(--text-muted); line-height: 1.6; }
.gt-reg-links { display: flex; flex-direction: column; gap: 6px; align-items: center; }
.gt-reg-done-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 8px; }
.gt-reg-done-actions .gt-btn { padding: 13px 24px; font-size: 15px; border-radius: 12px; }

@media (max-width: 640px) {
    .gt-reg-card { padding: 22px 18px; border-radius: 16px; }
    .gt-reg-title { font-size: 25px; }
    .gt-reg-row2, .gt-reg-facts { grid-template-columns: 1fr; }
    .gt-reg-step-label { display: none; }
    .gt-reg-addr-chip { display: none; }
    .gt-reg-actions { flex-direction: column-reverse; }
}
`;

/* ───────── helpers ───────── */

const Ic = ({ children, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
    </svg>
);
const IBack  = () => <Ic><path d="M19 12H5M12 19l-7-7 7-7" /></Ic>;
const ICheck = ({ size }) => <Ic size={size}><path d="M5 13l4 4L19 7" /></Ic>;
const IX     = () => <Ic size={16}><path d="M6 6l12 12M18 6L6 18" /></Ic>;
const IPlus  = () => <Ic><path d="M12 5v14M5 12h14" /></Ic>;
const IImage = () => <Ic size={22}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M21 16l-5-5-8 8" /></Ic>;
const IInfo  = () => <Ic><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></Ic>;
const IAlert = () => <Ic><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></Ic>;

// datetime-local wants "YYYY-MM-DDTHH:mm" in LOCAL time
const toLocalInput = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const inDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return toLocalInput(d); };
const daysFromNow = (v) => Math.ceil((new Date(v).getTime() - Date.now()) / 86400000);
const isValidAmount = (v) => /^\d*\.?\d+$/.test(v) && (v.split(".")[1] || "").length <= 18 && parseFloat(v) > 0;
// same formula as Campaign.sol: (2 * boardSize + 2) / 3
const approvalsNeeded = (n) => Math.floor((2 * n + 2) / 3);

const rowStatus = (value, i, all, me) => {
    const v = value.trim();
    if (!v) return { state: "empty" };
    if (!ethers.isAddress(v)) return { state: "bad", msg: "This is not a valid wallet address." };
    const lower = v.toLowerCase();
    if (me && lower === me.toLowerCase())
        return { state: "bad", msg: "You are the campaigner, so you can't also sit on the board." };
    if (all.some((o, j) => j !== i && o.trim().toLowerCase() === lower))
        return { state: "bad", msg: "This address is already on the board." };
    return { state: "ok" };
};

/* ───────── page ───────── */

const CampaignerRegister = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const {
        account, chainId, network, symbol, factoryAddress,
        connectWallet, switchNetwork, shortAddress, loading: walletLoading,
    } = useWallet();
    const { getFactoryContract } = useContract();

    const [step, setStep] = useState(0);
    const [form, setForm] = useState({ title: "", description: "", goal: "", deadline: "" });
    const [board, setBoard] = useState(["", "", ""]);
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});
    const [image, setImage] = useState(null); // { file, url }
    const [dragging, setDragging] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [launching, setLaunching] = useState(false);
    const [result, setResult] = useState(null); // { address, txHash }
    const fileRef = useRef(null);

    // free the preview URL when the image changes or the page closes
    useEffect(() => () => { if (image?.url) URL.revokeObjectURL(image.url); }, [image]);

    // bring the top of the card into view when the step changes
    useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step, result]);

    const boardStatuses = useMemo(
        () => board.map((v, i) => rowStatus(v, i, board, account)),
        [board, account]
    );
    const boardValid = board.length >= MIN_BOARD && boardStatuses.every((s) => s.state === "ok");

    /* ── field handlers ── */

    const setField = (name, value) => {
        setForm((f) => ({ ...f, [name]: value }));
        setErrors((e) => ({ ...e, [name]: undefined }));
    };

    const pickImage = (file) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setErrors((e) => ({ ...e, image: "That file isn't an image." }));
            return;
        }
        if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
            setErrors((e) => ({ ...e, image: `The image must be under ${MAX_IMAGE_MB} MB.` }));
            return;
        }
        setErrors((e) => ({ ...e, image: undefined }));
        setImage({ file, url: URL.createObjectURL(file) });
    };

    const setMember = (i, value) => setBoard((b) => b.map((v, j) => (j === i ? value : v)));
    const addMember = () => board.length < MAX_BOARD && setBoard((b) => [...b, ""]);
    const removeMember = (i) => {
        if (board.length <= MIN_BOARD) return;
        setBoard((b) => b.filter((_, j) => j !== i));
        setTouched({});
    };

    /* ── validation + navigation ── */

    const scrollToError = () =>
        setTimeout(() => {
            document.querySelector('.gt-reg [aria-invalid="true"]')
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 60);

    const validateDetails = () => {
        const e = {};
        if (!form.title.trim()) e.title = "Give your campaign a title.";
        if (!form.description.trim()) e.description = "Describe what the funds are for.";
        else if (form.description.trim().length < 20)
            e.description = "Add a little more detail so donors know where the money goes.";
        if (!isValidAmount(form.goal)) e.goal = "Enter a goal greater than 0, using numbers only.";
        else if (parseFloat(form.goal) < 0.01) e.goal = `The goal must be at least 0.01 ${symbol}.`;
        if (!form.deadline) e.deadline = "Pick an end date and time.";
        else if (new Date(form.deadline).getTime() <= Date.now() + 60 * 60 * 1000)
            e.deadline = "The deadline must be at least one hour from now.";
        return e;
    };

    const goNext = () => {
        if (step === 0) {
            const e = validateDetails();
            setErrors((prev) => ({ ...prev, ...e }));
            if (Object.keys(e).length) return scrollToError();
            setStep(1);
        } else if (step === 1) {
            if (!boardValid) {
                setTouched(Object.fromEntries(board.map((_, i) => [i, true])));
                return scrollToError();
            }
            setStep(2);
        }
    };

    /* ── launch ── */

    const handleLaunch = async () => {
        if (!account) { toast.info("Connect your wallet to launch."); connectWallet(); return; }
        if (!factoryAddress) {
            toast.error("GivTru isn't deployed on this network yet. Pick a supported network below.");
            return;
        }

        setLaunching(true);
        try {
            let ipfsHash = DEFAULT_IPFS_HASH;
            if (image?.file) {
                const id = toast.loading("Uploading image to IPFS...");
                try {
                    ipfsHash = await uploadImageToIPFS(image.file);
                } catch (err) {
                    console.error(err);
                    toast.dismiss(id);
                    toast.error("The image upload failed. Check your connection and try again.");
                    return;
                }
                toast.dismiss(id);
            }

            const factory = getFactoryContract();
            if (!factory) { toast.error("Your wallet isn't ready. Reconnect it and try again."); return; }

            const deadlineTs = Math.floor(new Date(form.deadline).getTime() / 1000);
            const members = board.map((a) => ethers.getAddress(a.trim()));

            const receipt = await toast.track(
                () => factory.createCampaign(
                    form.title.trim(),
                    form.description.trim(),
                    ipfsHash,
                    ethers.parseEther(form.goal),
                    deadlineTs,
                    members
                ),
                { pending: "Confirm the deployment in your wallet...", success: "Campaign deployed" }
            );
            if (!receipt) return; // error toast already shown

            let campaignAddress = null;
            for (const log of receipt.logs) {
                try {
                    const parsed = factory.interface.parseLog(log);
                    if (parsed?.name === "CampaignCreated") { campaignAddress = parsed.args.campaignAddress; break; }
                } catch { /* not a factory event */ }
            }
            setResult({ address: campaignAddress, txHash: receipt.hash });
        } finally {
            setLaunching(false);
        }
    };

    const reset = () => {
        setStep(0);
        setForm({ title: "", description: "", goal: "", deadline: "" });
        setBoard(["", "", ""]);
        setTouched({}); setErrors({}); setImage(null); setConfirmed(false); setResult(null);
    };

    /* ───────── render pieces ───────── */

    const walletBanner = !account ? (
        <div className="gt-reg-note is-info">
            <IInfo />
            <div>
                <p>You can fill in the form now. You'll need a connected wallet to launch the campaign.</p>
                <button className="gt-btn gt-btn-secondary" onClick={connectWallet} disabled={walletLoading}>
                    {walletLoading ? "Connecting..." : "Connect Wallet"}
                </button>
            </div>
        </div>
    ) : !network ? (
        <div className="gt-reg-note is-warn">
            <IAlert />
            <div>
                <p>Your wallet is on a network GivTru doesn't support.</p>
                <button className="gt-btn gt-btn-secondary" onClick={() => switchNetwork(DEFAULT_CHAIN_ID)}>
                    Switch to {NETWORKS[DEFAULT_CHAIN_ID].name}
                </button>
            </div>
        </div>
    ) : null;

    const stepper = (
        <div className="gt-reg-steps" role="list">
            {STEPS.map((label, i) => {
                const state = i < step ? "is-done" : i === step ? "is-current" : "";
                return (
                    <div key={label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                        <button
                            className={`gt-reg-step ${state}`}
                            onClick={() => i < step && setStep(i)}
                            disabled={i >= step}
                            aria-current={i === step ? "step" : undefined}
                        >
                            <span className="gt-reg-step-num">{i < step ? <ICheck size={16} /> : i + 1}</span>
                            <span className="gt-reg-step-label">{label}</span>
                        </button>
                        {i < STEPS.length - 1 && <div className={`gt-reg-step-line${i < step ? " is-done" : ""}`} />}
                    </div>
                );
            })}
        </div>
    );

    const detailsStep = (
        <div className="gt-reg-form">
            <div className="gt-reg-field">
                <div className="gt-reg-label-row">
                    <label className="gt-reg-label" htmlFor="title">Campaign title</label>
                    <span className="gt-reg-count">{form.title.length}/{TITLE_MAX}</span>
                </div>
                <input
                    id="title" className={`gt-reg-input${errors.title ? " is-error" : ""}`}
                    placeholder="e.g. Clean water for 200 families"
                    maxLength={TITLE_MAX} value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    aria-invalid={!!errors.title}
                />
                {errors.title && <p className="gt-reg-error">{errors.title}</p>}
            </div>

            <div className="gt-reg-field">
                <div className="gt-reg-label-row">
                    <label className="gt-reg-label" htmlFor="desc">Description</label>
                    <span className="gt-reg-count">{form.description.length}/{DESC_MAX}</span>
                </div>
                <textarea
                    id="desc" className={`gt-reg-input${errors.description ? " is-error" : ""}`}
                    placeholder="Who is this for, what will the money be spent on, and how will donors see the impact?"
                    maxLength={DESC_MAX} value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    aria-invalid={!!errors.description}
                />
                {errors.description
                    ? <p className="gt-reg-error">{errors.description}</p>
                    : <p className="gt-reg-hint">Stored on-chain, so keep it clear and to the point.</p>}
            </div>

            <div className="gt-reg-field">
                <div className="gt-reg-label-row">
                    <span className="gt-reg-label">Cover image <span className="gt-reg-opt">(optional)</span></span>
                </div>
                <input
                    ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={(e) => { pickImage(e.target.files?.[0]); e.target.value = ""; }}
                />
                {image ? (
                    <div className="gt-reg-preview">
                        <img src={image.url} alt="Campaign cover preview" />
                        <div className="gt-reg-preview-actions">
                            <button type="button" className="gt-reg-mini" onClick={() => fileRef.current?.click()}>Replace</button>
                            <button type="button" className="gt-reg-mini" onClick={() => setImage(null)}>Remove</button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        className={`gt-reg-drop${dragging ? " is-drag" : ""}`}
                        onClick={() => fileRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setDragging(false); pickImage(e.dataTransfer.files?.[0]); }}
                    >
                        <span className="gt-reg-drop-icon"><IImage /></span>
                        <strong>Click to upload, or drag an image here</strong>
                        <small>PNG or JPG, up to {MAX_IMAGE_MB} MB. Images on IPFS are public.</small>
                    </button>
                )}
                {errors.image && <p className="gt-reg-error">{errors.image}</p>}
            </div>

            <div className="gt-reg-row2">
                <div className="gt-reg-field">
                    <label className="gt-reg-label" htmlFor="goal">Funding goal</label>
                    <div className="gt-reg-affix">
                        <input
                            id="goal" className={`gt-reg-input${errors.goal ? " is-error" : ""}`}
                            inputMode="decimal" placeholder="10" value={form.goal}
                            onChange={(e) => setField("goal", e.target.value.trim())}
                            aria-invalid={!!errors.goal}
                        />
                        <span>{symbol}</span>
                    </div>
                    {errors.goal
                        ? <p className="gt-reg-error">{errors.goal}</p>
                        : <p className="gt-reg-hint">Donors can give from 0.01 {symbol}.</p>}
                </div>

                <div className="gt-reg-field">
                    <label className="gt-reg-label" htmlFor="deadline">Deadline</label>
                    <input
                        id="deadline" type="datetime-local"
                        className={`gt-reg-input${errors.deadline ? " is-error" : ""}`}
                        min={toLocalInput(new Date())} value={form.deadline}
                        onChange={(e) => setField("deadline", e.target.value)}
                        aria-invalid={!!errors.deadline}
                    />
                    {errors.deadline
                        ? <p className="gt-reg-error">{errors.deadline}</p>
                        : form.deadline && daysFromNow(form.deadline) > 0
                            ? <p className="gt-reg-hint">Ends in {daysFromNow(form.deadline)} day{daysFromNow(form.deadline) === 1 ? "" : "s"}.</p>
                            : null}
                    <div className="gt-reg-chips">
                        {[30, 60, 90].map((n) => (
                            <button key={n} type="button" className="gt-reg-chip" onClick={() => setField("deadline", inDays(n))}>
                                {n} days
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const boardStep = (
        <div className="gt-reg-form">
            <div className="gt-reg-note">
                <IInfo />
                <ul>
                    <li>
                        With {board.length} board members, a withdrawal needs <strong>{approvalsNeeded(board.length)}</strong> approvals.
                    </li>
                    <li>Pick independent people donors can trust, not just friends or family.</li>
                    <li>The board <strong>cannot be changed</strong> after the campaign is launched.</li>
                </ul>
            </div>

            <div className="gt-reg-board">
                {board.map((value, i) => {
                    const st = boardStatuses[i];
                    const showErr = st.state === "bad" && (touched[i] || value.trim().length >= 42);
                    return (
                        <div key={i} className={`gt-reg-member${st.state === "ok" ? " is-ok" : ""}`}>
                            <span className="gt-reg-member-num">{i + 1}</span>
                            <div className="gt-reg-member-body">
                                <div className="gt-reg-input-wrap">
                                    <input
                                        className={`gt-reg-input${showErr ? " is-error" : ""}`}
                                        placeholder="0x... wallet address"
                                        spellCheck={false} autoComplete="off"
                                        value={value}
                                        onChange={(e) => setMember(i, e.target.value)}
                                        onBlur={() => setTouched((t) => ({ ...t, [i]: true }))}
                                        aria-label={`Board member ${i + 1} address`}
                                        aria-invalid={showErr}
                                    />
                                    {st.state === "ok" && <span className="gt-reg-ok"><ICheck /></span>}
                                </div>
                                {showErr && <p className="gt-reg-error">{st.msg}</p>}
                                {touched[i] && st.state === "empty" && (
                                    <p className="gt-reg-error">Enter this member's wallet address.</p>
                                )}
                            </div>
                            {i >= MIN_BOARD && (
                                <button type="button" className="gt-reg-remove" onClick={() => removeMember(i)} aria-label={`Remove board member ${i + 1}`}>
                                    <IX />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {board.length < MAX_BOARD && (
                <button type="button" className="gt-reg-add" onClick={addMember}>
                    <IPlus /> Add another board member
                </button>
            )}
        </div>
    );

    const reviewStep = (
        <div className="gt-reg-form">
            <div className="gt-reg-review">
                {image && <img src={image.url} alt="" />}
                <div className="gt-reg-review-body">
                    <h3 className="gt-reg-review-title">{form.title}</h3>
                    <p className="gt-reg-review-desc">{form.description}</p>
                </div>
                <div className="gt-reg-facts">
                    <div className="gt-reg-fact"><span>Goal</span><strong>{form.goal} {symbol}</strong></div>
                    <div className="gt-reg-fact">
                        <span>Deadline</span>
                        <strong>{new Date(form.deadline).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</strong>
                    </div>
                    <div className="gt-reg-fact">
                        <span>Network</span>
                        {account ? (
                            <select
                                className="gt-reg-select"
                                value={NETWORKS[chainId] ? chainId : ""}
                                onChange={(e) => switchNetwork(e.target.value)}
                                aria-label="Network to deploy on"
                            >
                                {!NETWORKS[chainId] && <option value="">Unsupported network</option>}
                                {Object.values(NETWORKS).map((n) => (
                                    <option key={n.chainId} value={n.chainId}>{n.name}</option>
                                ))}
                            </select>
                        ) : <strong>Not connected</strong>}
                    </div>
                    <div className="gt-reg-fact">
                        <span>Approvals to withdraw</span>
                        <strong>{approvalsNeeded(board.length)} of {board.length}</strong>
                    </div>
                </div>
                <div className="gt-reg-addrs">
                    <span>Board members</span>
                    {board.map((a, i) => <div key={i} className="gt-reg-addr">{i + 1}. {a.trim()}</div>)}
                </div>
            </div>

            <div className="gt-reg-note is-warn">
                <IAlert />
                <ul>
                    <li>Launching deploys a new smart contract and costs a network fee.</li>
                    <li>The board and the goal cannot be changed after launch.</li>
                    <li>If the goal isn't reached by the deadline, donors can claim refunds.</li>
                </ul>
            </div>

            <label className="gt-reg-check">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                <span>I've checked the board addresses and understand they can't be changed.</span>
            </label>
        </div>
    );

    const doneView = (
        <div className="gt-reg-done">
            <div className="gt-reg-done-icon"><ICheck size={34} /></div>
            <h2>Your campaign is live</h2>
            <p>
                <strong>{form.title}</strong> is now deployed. Share the campaign page so donors can find it.
            </p>
            <div className="gt-reg-links">
                {result?.address && <TxLink type="address" hash={result.address} label="View contract on explorer" />}
                {result?.txHash && <TxLink hash={result.txHash} label="View deployment transaction" />}
            </div>
            <div className="gt-reg-done-actions">
                {result?.address && (
                    <button className="gt-btn gt-btn-primary" onClick={() => navigate(`/campaign/${result.address}`)}>
                        View campaign
                    </button>
                )}
                <button className="gt-btn gt-btn-secondary" onClick={() => navigate("/dashboard")}>Go to my campaigns</button>
                <button className="gt-btn gt-btn-secondary" onClick={reset}>Start another</button>
            </div>
        </div>
    );

    /* ───────── layout ───────── */

    return (
        <div className="gt-reg">
            <style>{css}</style>
            <CryptoBackdrop />

            <header className="gt-reg-head">
                <button className="gt-reg-logo" onClick={() => navigate("/")} aria-label="GivTru home">
                    <img src={GivTru} alt="" height="34" style={{ display: "block" }} />
                    GivTru
                </button>

                {account ? (
                    <div className={`gt-reg-wallet${network ? "" : " is-bad"}`}>
                        <span className="gt-reg-dot" />
                        <span>{network?.name || "Unsupported network"}</span>
                        <span className="gt-reg-mono gt-reg-addr-chip">{shortAddress(account)}</span>
                    </div>
                ) : (
                    <button className="gt-btn gt-btn-primary" onClick={connectWallet} disabled={walletLoading}>
                        {walletLoading ? "Connecting..." : "Connect Wallet"}
                    </button>
                )}
            </header>

            <main className="gt-reg-main">
                {!result && (
                    <button className="gt-reg-back" onClick={() => navigate("/")}>
                        <IBack /> Back to home
                    </button>
                )}

                <div className="gt-reg-card">
                    {result ? doneView : (
                        <>
                            <h1 className="gt-reg-title">Start a campaign</h1>
                            <p className="gt-reg-sub">
                                Set your goal, choose the board that approves every withdrawal, and launch it on-chain.
                            </p>

                            {stepper}
                            {walletBanner && <div style={{ marginBottom: 22 }}>{walletBanner}</div>}

                            {step === 0 && detailsStep}
                            {step === 1 && boardStep}
                            {step === 2 && reviewStep}

                            <div className="gt-reg-actions" style={{ marginTop: 28 }}>
                                {step > 0 && (
                                    <button className="gt-btn gt-btn-secondary" onClick={() => setStep(step - 1)} disabled={launching}>
                                        Back
                                    </button>
                                )}
                                {step < 2 ? (
                                    <button className="gt-btn gt-btn-primary" onClick={goNext}>
                                        {step === 0 ? "Next: board members" : "Next: review"}
                                    </button>
                                ) : (
                                    <button className="gt-btn gt-btn-primary" onClick={handleLaunch} disabled={!confirmed || launching}>
                                        {launching ? "Launching..." : account ? "Launch campaign" : "Connect wallet to launch"}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CampaignerRegister;
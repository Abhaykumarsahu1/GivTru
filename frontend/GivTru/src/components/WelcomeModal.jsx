import { useState } from "react";

const WelcomeModal = ({ onAgree }) => {
    const [checked, setChecked] = useState(false);
    const [activeTab, setActiveTab] = useState("donate");

    const tabs = [
        { id: "donate", label: "💝 Donating" },
        { id: "campaign", label: "🚀 Campaigning" },
        { id: "board", label: "🗳️ Board Voting" },
        { id: "track", label: "🔍 Tracking" },
    ];

    const content = {
        donate: [
            { step: "1", title: "Connect Wallet", desc: "Click 'Connect Wallet' and select your MetaMask account. Make sure you're on Arbitrum One network." },
            { step: "2", title: "Browse Campaigns", desc: "Go to 'Browse Campaigns' to see all active campaigns on the blockchain." },
            { step: "3", title: "Donate", desc: "Click 'Donate Now' on any active campaign. Minimum donation is 0.01 ETH. Funds go directly to the smart contract — not to any person." },
            { step: "4", title: "Track Your Donation", desc: "Go to 'My Dashboard' to see all campaigns you donated to and track where your money is at any time." },
        ],
        campaign: [
            { step: "1", title: "Connect Wallet", desc: "Connect your MetaMask wallet. This wallet will be the campaign owner." },
            { step: "2", title: "Start Campaign", desc: "Click 'Start Campaign', fill in your title, description, goal amount, deadline, and upload an image." },
            { step: "3", title: "Add Board Members", desc: "Add minimum 3 trusted board member wallet addresses. These people will govern your fund withdrawals." },
            { step: "4", title: "Deploy", desc: "Click 'Deploy Campaign'. MetaMask will ask you to confirm — pay the small gas fee and your campaign goes live on blockchain!" },
            { step: "5", title: "Request Withdrawal", desc: "When you need funds, go to 'My Dashboard', create a withdrawal request with description and amount. Board members will vote on it." },
        ],
        board: [
            { step: "1", title: "You Were Added", desc: "A campaigner added your wallet address as a board member when creating their campaign." },
            { step: "2", title: "Connect That Wallet", desc: "Connect the wallet address that was added as board member. The '🗳️ Board' button will appear in navbar automatically." },
            { step: "3", title: "View Requests", desc: "Click '🗳️ Board' to see all campaigns where you are a trustee and any pending withdrawal requests." },
            { step: "4", title: "Vote", desc: "Click 'Approve' or 'Reject' on each request. When 2 out of 3 board members approve, funds are automatically released to the campaigner." },
        ],
        track: [
            { step: "1", title: "Every Transaction On-Chain", desc: "Every donation, withdrawal request, vote, and fund release is permanently recorded on Arbitrum blockchain. Nobody can alter this history." },
            { step: "2", title: "View on Arbiscan", desc: "Click any '↗ Arbiscan' link in the app to see the full transaction history of any campaign contract." },
            { step: "3", title: "My Dashboard", desc: "Donors can see exactly which campaigns they donated to, how much, and the current status of funds in 'My Dashboard'." },
            { step: "4", title: "Funds Are Locked", desc: "Donated funds stay locked in the smart contract until board members approve a withdrawal. No single person can touch the funds alone." },
        ],
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>

                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.logoRow}>
                        <span style={styles.logoIcon}>🌱</span>
                        <span style={styles.logoText}>Givtru</span>
                    </div>
                    <h2 style={styles.title}>Welcome to Givtru</h2>
                    <p style={styles.subtitle}>
                        A decentralized charity platform where every donation is tracked on-chain
                        and funds are released only with board approval.
                    </p>
                </div>

                {/* Tabs */}
                <div style={styles.tabs}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            style={{
                                ...styles.tab,
                                background: activeTab === tab.id ? "#22c55e" : "transparent",
                                color: activeTab === tab.id ? "#000" : "#94a3b8",
                                border: activeTab === tab.id ? "none" : "1px solid #334155",
                            }}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={styles.content}>
                    {content[activeTab].map((item) => (
                        <div key={item.step} style={styles.step}>
                            <div style={styles.stepNum}>{item.step}</div>
                            <div style={styles.stepContent}>
                                <h4 style={styles.stepTitle}>{item.title}</h4>
                                <p style={styles.stepDesc}>{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Important notes */}
                <div style={styles.notesBox}>
                    <p style={styles.notesTitle}>⚠️ Important Notes</p>
                    <ul style={styles.notesList}>
                        <li style={styles.notesItem}>Minimum donation is <strong>0.01 ETH</strong></li>
                        <li style={styles.notesItem}>You need <strong>MetaMask</strong> wallet and <strong>Arbitrum One</strong> network</li>
                        <li style={styles.notesItem}>All transactions are <strong>irreversible</strong> — double check before confirming</li>
                        <li style={styles.notesItem}>Gas fees are paid in ETH and are typically less than <strong>$0.01</strong> on Arbitrum</li>
                        <li style={styles.notesItem}>Funds are <strong>never held by Givtru</strong> — only by the smart contract</li>
                    </ul>
                </div>

                {/* Checkbox */}
                <div style={styles.checkRow} onClick={() => setChecked(!checked)}>
                    <div style={{
                        ...styles.checkbox,
                        background: checked ? "#22c55e" : "transparent",
                        border: checked ? "2px solid #22c55e" : "2px solid #334155",
                    }}>
                        {checked && <span style={styles.checkmark}>✓</span>}
                    </div>
                    <p style={styles.checkLabel}>
                        I understand that Givtru is a decentralized platform. All transactions are on-chain and irreversible. I take full responsibility for my actions on this platform.
                    </p>
                </div>

                {/* Button */}
                <button
                    style={{
                        ...styles.agreeBtn,
                        opacity: checked ? 1 : 0.4,
                        cursor: checked ? "pointer" : "not-allowed",
                    }}
                    onClick={() => checked && onAgree()}
                    disabled={!checked}
                >
                    ✅ I Agree — Enter Givtru
                </button>

            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "20px",
    },
    modal: {
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "20px",
        padding: "32px",
        maxWidth: "640px",
        width: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    header: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        textAlign: "center",
    },
    logoRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
    },
    logoIcon: {
        fontSize: "28px",
    },
    logoText: {
        fontSize: "24px",
        fontWeight: "800",
        color: "#22c55e",
        fontFamily: "sans-serif",
    },
    title: {
        fontSize: "22px",
        fontWeight: "700",
        color: "#f1f5f9",
        margin: 0,
        fontFamily: "sans-serif",
    },
    subtitle: {
        color: "#94a3b8",
        fontSize: "14px",
        margin: 0,
        lineHeight: 1.6,
        fontFamily: "sans-serif",
    },
    tabs: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
    },
    tab: {
        padding: "8px 14px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "600",
        fontFamily: "sans-serif",
        transition: "all 0.2s",
    },
    content: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        background: "#0f172a",
        borderRadius: "12px",
        padding: "16px",
    },
    step: {
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
    },
    stepNum: {
        background: "#22c55e",
        color: "#000",
        borderRadius: "50%",
        width: "28px",
        height: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        fontWeight: "800",
        flexShrink: 0,
        fontFamily: "sans-serif",
    },
    stepContent: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    stepTitle: {
        color: "#f1f5f9",
        fontSize: "14px",
        fontWeight: "700",
        margin: 0,
        fontFamily: "sans-serif",
    },
    stepDesc: {
        color: "#94a3b8",
        fontSize: "13px",
        margin: 0,
        lineHeight: 1.5,
        fontFamily: "sans-serif",
    },
    notesBox: {
        background: "#0f172a",
        border: "1px solid #f59e0b",
        borderRadius: "10px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    notesTitle: {
        color: "#fcd34d",
        fontSize: "13px",
        fontWeight: "700",
        margin: 0,
        fontFamily: "sans-serif",
    },
    notesList: {
        margin: 0,
        paddingLeft: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    notesItem: {
        color: "#94a3b8",
        fontSize: "13px",
        lineHeight: 1.5,
        fontFamily: "sans-serif",
    },
    checkRow: {
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        cursor: "pointer",
    },
    checkbox: {
        width: "22px",
        height: "22px",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: "2px",
        transition: "all 0.2s",
    },
    checkmark: {
        color: "#000",
        fontSize: "14px",
        fontWeight: "800",
    },
    checkLabel: {
        color: "#94a3b8",
        fontSize: "13px",
        margin: 0,
        lineHeight: 1.6,
        fontFamily: "sans-serif",
    },
    agreeBtn: {
        background: "#22c55e",
        color: "#000",
        border: "none",
        padding: "14px",
        borderRadius: "10px",
        fontWeight: "bold",
        fontSize: "16px",
        fontFamily: "sans-serif",
        transition: "opacity 0.2s",
    },
};

export default WelcomeModal;
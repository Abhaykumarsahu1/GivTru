// Contract event queries.
// Some RPCs refuse very wide block ranges, so if the full-range query fails we
// retry over the most recent blocks and report `partial: true`.
export async function queryAll(contract, filter, provider) {
    try {
        return { events: await contract.queryFilter(filter, 0, "latest"), partial: false };
    } catch {
        const latest = await provider.getBlockNumber();
        const WINDOW = 50000;
        const jobs = Array.from({ length: 10 }, (_, i) => {
            const to = latest - i * WINDOW;
            if (to < 0) return Promise.resolve([]);
            return contract.queryFilter(filter, Math.max(0, to - WINDOW + 1), to);
        });
        return { events: (await Promise.all(jobs)).flat(), partial: true };
    }
}
import { useMemo } from 'react';

export default function useStagedMetaMap(staging) {
	return useMemo(() => {
		if (!staging) return {};
		const meta = {};
		const order = staging.order || [];
		for (const key of order) {
			const [empId, dateKey] = key.split('|');
			const entry = staging.getStagedEntry ? staging.getStagedEntry(empId, dateKey) : null;
			if (!entry || !entry.op || entry.op === 'noop') continue;
			if (!meta[empId]) meta[empId] = {};
			meta[empId][dateKey] = entry.op;
		}
		return meta;
	}, [staging]);
}

import { useMemo } from 'react';

export default function useStableMergedDataMap({ dataMap = {}, staging, employeeId, mode = 'single' }) {
	const mergedData = useMemo(() => {
		if (mode !== 'single' || !employeeId) return null;
		if (!staging || !staging.order || !staging.order.length) return dataMap[employeeId] || {};
		const base = dataMap[employeeId] || {};
		const overlays = {};
		for (const key of staging.order) {
			const [emp, dateKey] = key.split('|');
			if (emp !== employeeId) continue;
			const entry = staging.getStagedEntry(emp, dateKey);
			if (!entry) continue;
			overlays[dateKey] = entry.draft === null ? [] : entry.draft;
		}
		if (!Object.keys(overlays).length) return base;
		return { ...base, ...overlays };
	}, [dataMap, staging, employeeId, mode]);

	const getMergedDay = (empId, dateKey) => {
		if (!staging) return (dataMap?.[empId]?.[dateKey]) || [];
		const entry = staging.getStagedEntry ? staging.getStagedEntry(empId, dateKey) : null;
		if (!entry) return (dataMap?.[empId]?.[dateKey]) || [];
		return entry.draft === null ? [] : entry.draft;
	};

	return { mergedData, getMergedDay };
}

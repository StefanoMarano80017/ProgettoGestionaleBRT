import React, { useMemo, useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, Paper, IconButton, Tabs, Tab, ToggleButtonGroup, ToggleButton, LinearProgress, Chip, Divider, Avatar, Skeleton, alpha } from '@mui/material';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import WorkIcon from '@mui/icons-material/Work';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FolderIcon from '@mui/icons-material/Folder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { parseKeyToDate, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, inRange } from '@/shared/utils/dateRangeUtils';
import { BarChart } from '@mui/x-charts/BarChart';
import { getCommessaColor, getCommessaColorLight } from '@shared/utils/commessaColors';
import { getBalances } from '@domains/timesheet/services/projectService';
import { getVacationBalances } from '@mocks/TimesheetAbsencesMock';

const NON_WORK_COMMESSE = new Set(['FERIE', 'MALATTIA', 'PERMESSO', 'ROL', 'ROL_P', 'ROL_C', 'ROL_F']);

function formatDateKey(date) {
	if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function computeDailySummary(dataMap, start, end) {
	if (!start || !end) {
		return { totalHours: 0, daysWorked: 0, avgPerDay: 0, dailyValues: [] };
	}
	const totals = new Map();
	Object.entries(dataMap || {}).forEach(([key, records]) => {
		if (key.endsWith('_segnalazione')) return;
		const currentDate = parseKeyToDate(key);
		if (!inRange(currentDate, start, end)) return;
		const dayKey = formatDateKey(currentDate);
		(records || []).forEach((rec) => {
			if (!rec || !rec.commessa) return;
			const normalized = String(rec.commessa).trim().toUpperCase();
			if (NON_WORK_COMMESSE.has(normalized)) return;
			const hours = Number(rec.ore || 0);
			if (!Number.isFinite(hours) || hours <= 0) return;
			let day = totals.get(dayKey);
			if (!day) {
				day = { date: new Date(currentDate), hours: 0 };
				totals.set(dayKey, day);
			}
			day.hours += hours;
		});
	});
	const list = Array.from(totals.values()).sort((a, b) => a.date - b.date);
	const totalHours = list.reduce((sum, day) => sum + day.hours, 0);
	const daysWorked = list.filter((day) => day.hours > 0).length;
	const avgPerDay = daysWorked > 0 ? totalHours / daysWorked : 0;
	return { totalHours, daysWorked, avgPerDay, dailyValues: list };
}

function resolvePreviousRange(period, currentRange, refDate) {
	if (!currentRange || !currentRange.start || !currentRange.end) return null;
	if (period === 'week') {
		const start = new Date(currentRange.start);
		start.setDate(start.getDate() - 7);
		const end = new Date(currentRange.end);
		end.setDate(end.getDate() - 7);
		return { start, end, label: 'Settimana precedente' };
	}
	if (period === 'month') {
		const anchor = new Date(currentRange.start);
		anchor.setMonth(anchor.getMonth() - 1);
		const start = startOfMonth(anchor);
		const end = endOfMonth(anchor);
		return { start, end, label: 'Mese precedente' };
	}
	if (period === 'year') {
		const anchor = new Date(currentRange.start);
		anchor.setFullYear(anchor.getFullYear() - 1);
		const start = startOfYear(anchor);
		const end = endOfYear(anchor);
		return { start, end, label: 'Anno precedente' };
	}
	if (period === 'none') {
		const anchor = refDate ? new Date(refDate) : new Date();
		const start = new Date(anchor);
		start.setDate(start.getDate() - 1);
		start.setHours(0, 0, 0, 0);
		const end = new Date(anchor);
		end.setDate(end.getDate() - 1);
		end.setHours(23, 59, 59, 999);
		return { start, end, label: 'Giorno precedente' };
	}
	return null;
}

function isWorkingDay(date) {
	const day = date.getDay();
	return day !== 0 && day !== 6;
}

function computePreviousMonthCompleteness(dataMap, refDate) {
	const anchor = refDate ? new Date(refDate) : new Date();
	const prevMonth = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
	const start = startOfMonth(prevMonth);
	const end = endOfMonth(prevMonth);
	let workingDays = 0;
	let completeDays = 0;
	let partialDays = 0;
	let missingDays = 0;
	for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
		if (!isWorkingDay(cursor)) continue;
		workingDays += 1;
		const key = formatDateKey(cursor);
		const records = dataMap?.[key] || [];
		if (!Array.isArray(records) || records.length === 0) {
			missingDays += 1;
			continue;
		}
		let hours = 0;
		records.forEach((rec) => {
			if (!rec) return;
			const value = Number(rec.ore || 0);
			if (!Number.isFinite(value) || value <= 0) return;
			hours += value;
		});
		if (hours >= 8) completeDays += 1;
		else if (hours > 0) partialDays += 1;
		else missingDays += 1;
	}
	const coverage = workingDays > 0 ? (completeDays / workingDays) * 100 : 0;
	return { workingDays, completeDays, partialDays, missingDays, coverage };
}

export default function CommesseDashboard({ assignedCommesse = [], data = {}, period = 'month', refDate = new Date(), selectedDay, employeeId, onPeriodChange, onCommessaSelect }) {
	const [selectedCommessa, setSelectedCommessa] = useState(null);
	const [breakdownPage, setBreakdownPage] = useState(0);
	const [balanceState, setBalanceState] = useState({ loading: false, error: '', permesso: null, rol: null, ferie: null });
	
	const handlePeriodToggle = useCallback((event, nextValue) => {
		if (!onPeriodChange) return;
		if (nextValue === null) {
			onPeriodChange('none');
			return;
		}
		onPeriodChange(nextValue);
	}, [onPeriodChange]);
	
	const pivotYear = useMemo(() => {
		const base = period === 'none' && selectedDay ? parseKeyToDate(selectedDay) : refDate;
		if (!(base instanceof Date) || Number.isNaN(base.getTime())) return new Date().getFullYear();
		return base.getFullYear();
	}, [period, selectedDay, refDate]);
	
	const previousMonthSummary = useMemo(() => computePreviousMonthCompleteness(data, refDate), [data, refDate]);
	
	const range = useMemo(() => {
		if (period === 'week') {
			return { start: startOfWeek(refDate), end: endOfWeek(refDate) };
		}
		if (period === 'month') {
			return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
		}
		if (period === 'year') {
			return { start: startOfYear(refDate), end: endOfYear(refDate) };
		}
		const start = new Date(refDate);
		start.setHours(0, 0, 0, 0);
		const end = new Date(refDate);
		end.setHours(23, 59, 59, 999);
		return { start, end };
	}, [period, refDate]);
	
	const chartData = useMemo(() => {
		if (period === 'none') {
			const dateToUse = selectedDay ? parseKeyToDate(selectedDay) : refDate;
			const dayKey = selectedDay || formatDateKey(dateToUse);
			const dayRecords = data[dayKey] || [];
			
			// Build a map of commessa -> activities with hours
			const commessaActivities = new Map();

			dayRecords.forEach((rec) => {
				if (!rec || !rec.commessa) return;
				const commessa = String(rec.commessa).trim();
				if (!commessa) return;
				const normalized = commessa.toUpperCase();
				if (NON_WORK_COMMESSE.has(normalized)) return;
				
				const hours = Number(rec.ore || 0);
				const activity = rec.attivita || rec.sottocommessa || 'Attività generale';
				
				if (!commessaActivities.has(commessa)) {
					commessaActivities.set(commessa, {
						total: 0,
						activities: new Map(),
					});
				}
				
				const commessaData = commessaActivities.get(commessa);
				commessaData.total += hours;
				
				if (!commessaData.activities.has(activity)) {
					commessaData.activities.set(activity, 0);
				}
				commessaData.activities.set(activity, commessaData.activities.get(activity) + hours);
			});

			const entries = Array.from(commessaActivities.entries()).filter(([, data]) => data.total > 0);
			if (entries.length === 0) {
				return { series: [], xAxis: [], isEmpty: true, isStacked: false, xLabel: 'Commesse', width: 360, isDailyView: true, dailyData: [] };
			}

			const commessaList = entries.map(([commessa]) => commessa);
			const series = entries.map(([commessa, data], idx, arr) => ({
				data: arr.map((_, dataIdx) => (dataIdx === idx ? data.total : 0)),
				label: commessa,
				color: getCommessaColor(commessa),
			}));

			// Create a lookup map from assignedCommesse
			const commessaInfoMap = new Map();
			if (assignedCommesse && Array.isArray(assignedCommesse)) {
				assignedCommesse.forEach((item) => {
					const name = item.nome || item;
					commessaInfoMap.set(name, item);
				});
			}

			// Create detailed daily data with activities and commessa info
			const dailyData = entries.map(([commessa, data]) => {
				const commessaInfo = commessaInfoMap.get(commessa);
				return {
					commessa,
					hours: data.total,
					activities: Array.from(data.activities.entries()).map(([name, hours]) => ({ name, hours })),
					descrizione: commessaInfo?.descrizione,
					cliente: commessaInfo?.cliente,
				};
			});

			const totalHours = dailyData.reduce((sum, item) => sum + item.hours, 0);
			const totalActivities = dailyData.reduce((sum, item) => sum + item.activities.length, 0);

			return {
				series,
				xAxis: commessaList,
				isEmpty: false,
				isStacked: false,
				xLabel: 'Commesse',
				width: Math.max(360, commessaList.length * 70),
				isDailyView: true,
				dailyData,
				stats: {
					totalHours,
					totalCommesse: dailyData.length,
					totalActivities,
					avgHoursPerCommessa: dailyData.length > 0 ? totalHours / dailyData.length : 0,
				}
			};
		}

		const bucketMap = new Map(); // bucketKey -> { date: Date, values: Map(commessa -> hours) }
		const commessaSet = new Set();
		const commessaActivitiesMap = new Map(); // commessa -> Map(activity -> hours)
		const commessaDayOccurrences = new Map(); // commessa -> Set(dayKey)
		const dailyTotals = new Map(); // dayKey -> { date, hours }

		Object.entries(data || {}).forEach(([key, records]) => {
			if (key.endsWith('_segnalazione')) return;
			const currentDate = parseKeyToDate(key);
			if (!inRange(currentDate, range.start, range.end)) return;
			const dayKey = formatDateKey(currentDate);

			let bucketKey;
			let bucketDate;
			if (period === 'week') {
				bucketKey = dayKey;
				bucketDate = currentDate;
			} else if (period === 'month') {
				const weekStart = startOfWeek(currentDate);
				bucketKey = formatDateKey(weekStart);
				bucketDate = weekStart;
			} else {
				const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
				bucketKey = formatDateKey(monthStart);
				bucketDate = monthStart;
			}

			if (!bucketMap.has(bucketKey)) {
				bucketMap.set(bucketKey, { date: bucketDate, values: new Map() });
			}
			const bucket = bucketMap.get(bucketKey);

			(records || []).forEach((rec) => {
				if (!rec || !rec.commessa) return;
				const commessa = String(rec.commessa).trim();
				if (!commessa) return;
				const normalized = commessa.toUpperCase();
				if (NON_WORK_COMMESSE.has(normalized)) return;
				const hours = Number(rec.ore || 0);
				if (hours <= 0) return;
				const activity = rec.attivita || rec.sottocommessa || 'Attività generale';
				
				commessaSet.add(commessa);
				bucket.values.set(commessa, (bucket.values.get(commessa) || 0) + hours);
				let daySummary = dailyTotals.get(dayKey);
				if (!daySummary) {
					daySummary = { date: new Date(currentDate), hours: 0 };
					dailyTotals.set(dayKey, daySummary);
				}
				daySummary.hours += hours;
				let commessaDays = commessaDayOccurrences.get(commessa);
				if (!commessaDays) {
					commessaDays = new Set();
					commessaDayOccurrences.set(commessa, commessaDays);
				}
				commessaDays.add(dayKey);
				
				// Track activities per commessa
				if (!commessaActivitiesMap.has(commessa)) {
					commessaActivitiesMap.set(commessa, new Map());
				}
				const activities = commessaActivitiesMap.get(commessa);
				activities.set(activity, (activities.get(activity) || 0) + hours);
			});
		});

		const dailyList = Array.from(dailyTotals.values()).sort((a, b) => a.date - b.date);
		const totalHours = dailyList.reduce((sum, day) => sum + day.hours, 0);
		const daysWorked = dailyList.filter((day) => day.hours > 0).length;
		const avgHoursPerDay = daysWorked > 0 ? totalHours / daysWorked : 0;

		if (!bucketMap.size) {
			return { series: [], xAxis: [], isEmpty: true, isStacked: true, xLabel: 'Periodo', width: 400 };
		}

		const buckets = Array.from(bucketMap.values()).sort((a, b) => a.date - b.date);
		const commessaList = Array.from(commessaSet).sort();

		const xAxis = buckets.map((bucket, idx) => {
			if (period === 'week') {
				return bucket.date.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit' });
			}
			if (period === 'month') {
				return `Sett ${idx + 1}`;
			}
			return bucket.date.toLocaleDateString('it-IT', { month: 'short' });
		});

		const series = commessaList.map((commessa) => ({
			data: buckets.map((bucket) => bucket.values.get(commessa) || 0),
			label: commessa,
			color: getCommessaColor(commessa),
			stack: 'total',
		}));

		const topCommessa = commessaList.length > 0 
			? commessaList.reduce((top, comm, idx) => {
				const hours = series[idx].data.reduce((a, b) => a + b, 0);
				return hours > top.hours ? { name: comm, hours } : top;
			}, { name: '', hours: 0 })
			: null;

		// Calculate per-commessa breakdown
		const commessaBreakdown = commessaList.map((commessa, idx) => {
			const values = series[idx].data;
			const hours = values.reduce((a, b) => a + b, 0);
			const daysActive = commessaDayOccurrences.get(commessa)?.size || 0;
			const percentage = totalHours > 0 ? (hours / totalHours) * 100 : 0;
			const avgPerActiveDay = daysActive > 0 ? hours / daysActive : 0;
			let firstAvg = values.length ? values[0] : 0;
			let secondAvg = firstAvg;
			if (values.length > 1) {
				const splitIndex = Math.max(1, Math.floor(values.length / 2));
				const firstSlice = values.slice(0, splitIndex);
				const secondSlice = values.slice(splitIndex);
				const firstTotal = firstSlice.reduce((a, b) => a + b, 0);
				const secondTotal = secondSlice.reduce((a, b) => a + b, 0);
				firstAvg = firstSlice.length > 0 ? firstTotal / firstSlice.length : 0;
				secondAvg = secondSlice.length > 0 ? secondTotal / secondSlice.length : 0;
			}
			const trendValue = secondAvg - firstAvg;
			const trendPercentage = firstAvg !== 0 ? (trendValue / firstAvg) * 100 : (secondAvg > 0 ? 100 : 0);
			
			// Get activities for this commessa
			const activitiesMap = commessaActivitiesMap.get(commessa) || new Map();
			const activities = Array.from(activitiesMap.entries())
				.map(([name, hours]) => ({ name, hours }))
				.sort((a, b) => b.hours - a.hours);
			
			return {
				name: commessa,
				hours,
				daysActive,
				percentage,
				avgPerActiveDay,
				activities,
				trend: {
					value: trendValue,
					percentage: trendPercentage,
					isIncreasing: trendValue >= 0,
					firstAvg,
					secondAvg,
				},
			};
		}).sort((a, b) => b.hours - a.hours);

		const dailyHours = dailyList.map((day) => day.hours);
		const maxDailyHours = dailyHours.length ? Math.max(...dailyHours) : 0;
		const nonZeroDailyHours = dailyHours.filter((h) => h > 0);
		const minDailyHours = nonZeroDailyHours.length ? Math.min(...nonZeroDailyHours) : 0;
		const avgDailyHours = dailyHours.length ? dailyHours.reduce((a, b) => a + b, 0) / dailyHours.length : 0;

		const previousRange = resolvePreviousRange(period, range, refDate);
		let trend = null;
		if (previousRange) {
			const previousSummary = computeDailySummary(data, previousRange.start, previousRange.end);
			if (previousSummary.daysWorked > 0 || daysWorked > 0) {
				const deltaAvg = avgHoursPerDay - previousSummary.avgPerDay;
				const percentage = previousSummary.avgPerDay > 0
					? (deltaAvg / previousSummary.avgPerDay) * 100
					: (avgHoursPerDay > 0 ? 100 : 0);
				trend = {
					value: deltaAvg,
					percentage,
					isIncreasing: deltaAvg >= 0,
					previousAvg: previousSummary.avgPerDay,
					currentAvg: avgHoursPerDay,
					label: previousRange.label,
					previousDays: previousSummary.daysWorked,
					currentDays: daysWorked,
				};
			}
		}

		return {
			series,
			xAxis,
			isEmpty: false,
			isStacked: true,
			xLabel: period === 'week' ? 'Giorni' : period === 'month' ? 'Settimane' : 'Mesi',
			width: Math.max(400, buckets.length * 60),
			isDailyView: false,
			stats: {
				totalHours,
				daysWorked,
				avgHoursPerDay,
				topCommessa,
				totalCommesse: commessaList.length,
				commessaBreakdown,
				distribution: {
					max: maxDailyHours,
					min: minDailyHours,
					avg: avgDailyHours,
				},
				trend,
			}
		};
		}, [data, period, range, refDate, selectedDay]);
		const breakdownItems = chartData.stats?.commessaBreakdown || [];
		const BREAKDOWN_PAGE_SIZE = 4;
		const totalBreakdownPages = Math.max(1, Math.ceil(breakdownItems.length / BREAKDOWN_PAGE_SIZE));
		const pagedBreakdown = useMemo(() => {
			const start = breakdownPage * BREAKDOWN_PAGE_SIZE;
			return breakdownItems.slice(start, start + BREAKDOWN_PAGE_SIZE);
		}, [breakdownItems, breakdownPage]);

		// Extract all unique commesse from the data for the empty day view
		const allCommesseList = useMemo(() => {
			if (!data || Object.keys(data).length === 0) return [];
			const commesseSet = new Set();
			Object.values(data).forEach((dayRecords) => {
				if (Array.isArray(dayRecords)) {
					dayRecords.forEach((rec) => {
						if (rec && rec.commessa) {
							commesseSet.add(String(rec.commessa).trim());
						}
					});
				}
			});
			return Array.from(commesseSet).sort();
		}, [data]);

		useEffect(() => {
			if (breakdownPage >= totalBreakdownPages) {
				setBreakdownPage(Math.max(0, totalBreakdownPages - 1));
			}
		}, [breakdownPage, totalBreakdownPages]);
		useEffect(() => { setBreakdownPage(0); }, [period, selectedDay, refDate]);
		useEffect(() => {
			if (!employeeId) {
				setBalanceState({ loading: false, error: '', permesso: null, rol: null, ferie: null });
				return;
			}
			let active = true;
			setBalanceState((prev) => ({ ...prev, loading: true, error: '' }));
			(async () => {
				try {
					const [permRol, ferieRows] = await Promise.all([
						getBalances(employeeId),
						getVacationBalances({ year: pivotYear, employeeIds: [employeeId] }),
					]);
					if (!active) return;
					const permVal = Number(permRol?.permesso ?? 0);
					const rolVal = Number(permRol?.rol ?? 0);
					const ferieRow = Array.isArray(ferieRows) ? ferieRows.find((row) => row?.employeeId === employeeId) : null;
					const ferieValRaw = ferieRow ? (ferieRow.residualHours ?? ferieRow.residual ?? null) : null;
					const ferieVal = Number(ferieValRaw);
					setBalanceState({
						loading: false,
						error: '',
						permesso: Number.isFinite(permVal) ? permVal : 0,
						rol: Number.isFinite(rolVal) ? rolVal : 0,
						ferie: Number.isFinite(ferieVal) ? ferieVal : null,
					});
				} catch (err) {
					if (!active) return;
					setBalanceState({ loading: false, error: err?.message || 'Impossibile recuperare i saldi', permesso: null, rol: null, ferie: null });
				}
			})();
			return () => { active = false; };
		}, [employeeId, pivotYear]);
	const riepilogo = useMemo(() => {
		if (data && data.__monthlySummary) return {
			ferie: data.__monthlySummary.ferie || { days: 0, hours: 0 },
			malattia: data.__monthlySummary.malattia || { days: 0, hours: 0 },
			permesso: data.__monthlySummary.permesso || { days: 0, hours: 0 },
			rol: data.__monthlySummary.rol || { days: 0, hours: 0 },
		};
		const acc = { ferie: { days: 0, hours: 0 }, malattia: { days: 0, hours: 0 }, permesso: { days: 0, hours: 0 }, rol: { days: 0, hours: 0 } };
		Object.entries(data || {}).forEach(([key, records]) => {
			if (key.endsWith('_segnalazione')) return;
			const d = parseKeyToDate(key);
			if (!inRange(d, range.start, range.end)) return;
			const seen = { ferie: false, malattia: false, permesso: false, rol: false };
			(records || []).forEach((r) => {
				const ore = Number(r.ore || 0);
				const c = String(r.commessa || '').toUpperCase();
				if (c === 'FERIE') { acc.ferie.hours += ore; if (!seen.ferie) { acc.ferie.days += 1; seen.ferie = true; } }
				else if (c === 'MALATTIA') { acc.malattia.hours += ore; if (!seen.malattia) { acc.malattia.days += 1; seen.malattia = true; } }
				else if (c === 'PERMESSO') { acc.permesso.hours += ore; if (!seen.permesso) { acc.permesso.days += 1; seen.permesso = true; } }
				else if (c === 'ROL' || c.startsWith('ROL_')) { acc.rol.hours += ore; if (!seen.rol) { acc.rol.days += 1; seen.rol = true; } }
			});
		});
		return acc;
	}, [data, range]);
	const hasAbsenceData = React.useMemo(() => {
		return Object.values(riepilogo || {}).some((entry) => (entry?.days || 0) > 0 || (entry?.hours || 0) > 0);
	}, [riepilogo]);
	const absenceCards = useMemo(() => {
		if (!hasAbsenceData) return null;
		
		const buildCard = (IconComponent, label, color, entry) => (
			<Paper
				key={label}
				elevation={0}
				sx={{
					p: 1.2,
					borderRadius: 2,
					border: '1px solid',
					borderColor: 'divider',
					bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
				}}
			>
				<Stack spacing={0.5}>
					<Stack direction="row" alignItems="center" spacing={0.5}>
						<Avatar
							variant="circular"
							sx={{ width: 24, height: 24, bgcolor: color, fontSize: 12 }}
						>
							<IconComponent sx={{ fontSize: 14, color: '#fff' }} />
						</Avatar>
						<Typography
							variant="caption"
							sx={{
								fontWeight: 700,
								fontSize: '0.65rem',
								textTransform: 'uppercase',
								letterSpacing: 0.5,
								color: 'text.secondary',
							}}
						>
							{label}
						</Typography>
					</Stack>
					<Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ flexWrap: 'wrap' }}>
						<Stack direction="row" alignItems="baseline" spacing={0.5}>
							<Typography variant="h6" sx={{ px: 0.5, fontWeight: 700, color, lineHeight: 1, fontSize: '0.9rem' }}>
								{entry.days || 0}
							</Typography>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem' }}>
								giorni
							</Typography>
						</Stack>
						<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', fontWeight: 600 }}>
							{entry.hours || 0} h registrate
						</Typography>
					</Stack>
				</Stack>
			</Paper>
		);

		return (
			<Box
				sx={{
					display: 'grid',
					gap: 1.5,
					gridTemplateColumns: {
						xs: 'repeat(2, minmax(0, 1fr))',
						md: 'repeat(4, minmax(0, 1fr))',
					},
				}}
			>
				{buildCard(BeachAccessIcon, 'Ferie', '#D8315B', riepilogo.ferie)}
				{buildCard(LocalHospitalIcon, 'Malattia', '#34C759', riepilogo.malattia)}
				{buildCard(ScheduleIcon, 'Permesso', '#0288D1', riepilogo.permesso)}
				{buildCard(EventBusyIcon, 'ROL', '#FF9F0A', riepilogo.rol)}
			</Box>
		);
	}, [hasAbsenceData, riepilogo]);

	const periodDisplay = useMemo(() => {
		if (period === 'week') {
			const start = range.start.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
			const end = range.end.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
			return `${start} - ${end}`;
		}
		if (period === 'month') {
			return range.start.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
		}
		if (period === 'year') {
			return range.start.getFullYear().toString();
		}
		if (period === 'none') {
			const dateToUse = selectedDay ? parseKeyToDate(selectedDay) : refDate;
			return dateToUse.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
		}
		return '';
	}, [period, range, refDate, selectedDay]);
	const formatBalanceHours = (value) => (Number.isFinite(value) ? `${value.toFixed(1)}h` : '—');
	const renderBalanceSummary = () => {
		if (balanceState.loading) {
			return (
				<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
					<Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2 }} />
					<Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2 }} />
					<Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2 }} />
				</Box>
			);
		}
		if (balanceState.error) {
			return (
				<Paper
					elevation={0}
					sx={{
						p: 2,
						borderRadius: 2,
						border: '1px solid',
						borderColor: 'error.main',
						bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.08)' : 'rgba(211, 47, 47, 0.04)',
					}}
				>
					<Typography variant="caption" color="error" sx={{ textAlign: 'center', display: 'block' }}>
						{balanceState.error}
					</Typography>
				</Paper>
			);
		}
		if (balanceState.permesso === null && balanceState.rol === null && balanceState.ferie === null) return null;
		
		const ferieValue = balanceState.ferie;
		const ferieDays = Number.isFinite(ferieValue) ? (ferieValue / 8).toFixed(1) : '—';
		const ferieHours = Number.isFinite(ferieValue) ? ferieValue.toFixed(1) : '—';
		
		const balanceItems = [
			{
				label: 'Permesso',
				value: balanceState.permesso,
				hours: formatBalanceHours(balanceState.permesso),
				icon: ScheduleIcon,
				color: '#0288D1',
				bgColor: 'rgba(2, 136, 209, 0.08)',
			},
			{
				label: 'ROL',
				value: balanceState.rol,
				hours: formatBalanceHours(balanceState.rol),
				icon: EventBusyIcon,
				color: '#FF9F0A',
				bgColor: 'rgba(255, 159, 10, 0.08)',
			},
			{
				label: 'Ferie',
				value: ferieValue,
				hours: ferieHours,
				days: ferieDays,
				icon: BeachAccessIcon,
				color: '#D8315B',
				bgColor: 'rgba(216, 49, 91, 0.08)',
			},
		];
		
		return (
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: 'repeat(3, 1fr)',
					gap: 1,
				}}
			>
				{balanceItems.map((item) => {
					const Icon = item.icon;
					const isAvailable = Number.isFinite(item.value) && item.value !== null;
					
					return (
						<Paper
							key={item.label}
							elevation={0}
							sx={{
								p: 1.25,
								borderRadius: 1.5,
								border: '1px solid',
								borderColor: isAvailable ? item.color : 'divider',
								bgcolor: isAvailable ? item.bgColor : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
								transition: 'all 0.2s',
								'&:hover': {
									borderColor: item.color,
									bgcolor: item.bgColor,
									transform: 'translateY(-2px)',
									boxShadow: `0 4px 12px ${item.color}20`,
								},
							}}
						>
							<Stack spacing={0.75}>
								<Stack direction="row" alignItems="center" spacing={0.75}>
									<Avatar
										sx={{
											width: 24,
											height: 24,
											bgcolor: item.color,
											fontSize: 12,
										}}
									>
										<Icon sx={{ fontSize: 14 }} />
									</Avatar>
									<Typography
										variant="caption"
										sx={{
											fontWeight: 700,
											fontSize: '0.65rem',
											textTransform: 'uppercase',
											letterSpacing: 0.5,
											color: 'text.secondary',
										}}
									>
										{item.label}
									</Typography>
								</Stack>
								
								<Box>
									<Typography
										variant="h6"
										sx={{
											fontWeight: 700,
											color: isAvailable ? item.color : 'text.disabled',
											lineHeight: 1,
											fontSize: '0.95rem',
										}}
									>
										{item.hours}
									</Typography>
									{item.days && (
										<Typography
											variant="caption"
											sx={{
												color: 'text.secondary',
												fontSize: '0.6rem',
												fontWeight: 500,
											}}
										>
											({item.days} gg)
										</Typography>
									)}
								</Box>
							</Stack>
						</Paper>
					);
				})}
			</Box>
		);
	};
	const renderCompletenessCard = () => {
		if (!previousMonthSummary || previousMonthSummary.workingDays === 0) return null;
		const coverageValue = Math.max(0, Math.min(100, previousMonthSummary.coverage));
		const isComplete = coverageValue >= 100;
		
		return (
			<Paper
				variant="outlined"
				sx={(theme) => ({
					p: 1.25,
					borderRadius: 1.5,
					bgcolor: isComplete
						? alpha(theme.palette.success.main, 0.05)
						: coverageValue >= 80 
							? alpha(theme.palette.warning.main, 0.05)
							: alpha(theme.palette.error.main, 0.05),
					borderColor: isComplete
						? alpha(theme.palette.success.main, 0.3)
						: coverageValue >= 80
							? alpha(theme.palette.warning.main, 0.3)
							: alpha(theme.palette.error.main, 0.3),
				})}
			>
				<Stack spacing={1}>
					<Stack direction="row" spacing={1} alignItems="center">
						{isComplete ? (
							<CheckCircleOutlineIcon 
								color="success" 
								sx={{ fontSize: 24 }} 
							/>
						) : (
							<WarningAmberIcon 
								color={coverageValue >= 80 ? 'warning' : 'error'}
								sx={{ fontSize: 24 }} 
							/>
						)}
						<Box sx={{ flex: 1 }}>
							<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
								Mese precedente
							</Typography>
							<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
								Completezza timesheet
							</Typography>
						</Box>
						<Typography 
							variant="h6" 
							sx={{ 
								fontWeight: 700,
								fontSize: '1.1rem',
								color: isComplete 
									? 'success.main' 
									: coverageValue >= 80 
										? 'warning.main' 
										: 'error.main'
							}}
						>
							{coverageValue.toFixed(0)}%
						</Typography>
					</Stack>
					
					<Box
						sx={(theme) => ({
							height: 5,
							bgcolor: alpha(theme.palette.divider, 0.1),
							borderRadius: 2.5,
							overflow: 'hidden',
						})}
					>
						<Box
							sx={(theme) => ({
								width: `${coverageValue}%`,
								height: '100%',
								bgcolor: isComplete
									? theme.palette.success.main
									: coverageValue >= 80
										? theme.palette.warning.main
										: theme.palette.error.main,
								transition: 'width 0.3s ease',
							})}
						/>
					</Box>
					
					<Stack direction="row" spacing={1.5} sx={{ pt: 0.25 }}>
						<Box>
							<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
								Completi
							</Typography>
							<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
								{previousMonthSummary.completeDays}/{previousMonthSummary.workingDays}
							</Typography>
						</Box>
						{previousMonthSummary.partialDays > 0 && (
							<Box>
								<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
									Parziali
								</Typography>
								<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'warning.main' }}>
									{previousMonthSummary.partialDays}
								</Typography>
							</Box>
						)}
						{previousMonthSummary.missingDays > 0 && (
							<Box>
								<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
									Mancanti
								</Typography>
								<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'error.main' }}>
									{previousMonthSummary.missingDays}
								</Typography>
							</Box>
						)}
					</Stack>
				</Stack>
			</Paper>
		);
	};

	const renderCompletenessCardCompact = () => {
		if (!previousMonthSummary || previousMonthSummary.workingDays === 0) return null;
		const coverageValue = Math.max(0, Math.min(100, previousMonthSummary.coverage));
		const isComplete = coverageValue >= 100;
		const isWarning = coverageValue >= 80;
		
		return (
			<Paper 
				elevation={0}
				sx={(theme) => ({ 
					p: 1.25, 
					borderRadius: 2,
					border: '1px solid',
					bgcolor: isComplete
						? alpha(theme.palette.success.main, 0.08)
						: isWarning 
							? alpha(theme.palette.warning.main, 0.08)
							: alpha(theme.palette.error.main, 0.08),
					borderColor: isComplete
						? alpha(theme.palette.success.main, 0.4)
						: isWarning
							? alpha(theme.palette.warning.main, 0.4)
							: alpha(theme.palette.error.main, 0.4),
				})}
			>
				<Stack direction="row" alignItems="center" spacing={1.25}>
					{isComplete ? (
						<CheckCircleOutlineIcon 
							color="success" 
							sx={{ fontSize: 22 }} 
						/>
					) : (
						<WarningAmberIcon 
							color={isWarning ? 'warning' : 'error'}
							sx={{ fontSize: 22 }} 
						/>
					)}
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Typography variant="caption" sx={{ 
							color: 'text.secondary', 
							fontSize: '0.65rem', 
							fontWeight: 600, 
							textTransform: 'uppercase', 
							letterSpacing: 0.5,
							display: 'block',
							lineHeight: 1.3
						}}>
							Completezza Mese Prec.
						</Typography>
						<Typography variant="body2" sx={{ 
							fontWeight: 700, 
							fontSize: '0.8rem',
							lineHeight: 1.3,
							color: isComplete 
								? 'success.main' 
								: isWarning 
									? 'warning.main' 
									: 'error.main'
						}}>
							{coverageValue.toFixed(0)}% • {previousMonthSummary.completeDays}/{previousMonthSummary.workingDays} giorni
						</Typography>
					</Box>
					{previousMonthSummary.missingDays > 0 && (
						<Chip 
							label={`-${previousMonthSummary.missingDays}`}
							size="small"
							color="error"
							sx={{ 
								height: 22, 
								fontSize: '0.65rem',
								fontWeight: 600,
								'& .MuiChip-label': { px: 1 }
							}}
						/>
					)}
				</Stack>
			</Paper>
		);
	};

	const balanceSummaryElement = renderBalanceSummary();
	const completenessCardElement = renderCompletenessCard();
	const completenessCardCompactElement = renderCompletenessCardCompact();
	const handleSelectCommessa = (comm) => {
		const next = selectedCommessa === comm ? null : comm;
		setSelectedCommessa(next);
		if (typeof onCommessaSelect === 'function') onCommessaSelect(next);
	};
	const handlePrevBreakdownPage = () => {
		setBreakdownPage((prev) => Math.max(0, prev - 1));
	};
	const handleNextBreakdownPage = () => {
		setBreakdownPage((prev) => Math.min(totalBreakdownPages - 1, prev + 1));
	};
	return (
		<Paper 
			elevation={0}
			sx={(theme) => ({ 
				p: 2, 
				borderRadius: 3, 
				height: '100%', 
				display: 'flex', 
				flexDirection: 'column',
				border: '1px solid',
				borderColor: theme.palette.mode === 'dark'
					? 'rgba(255, 255, 255, 0.08)'
					: theme.palette.divider,
				bgcolor: theme.palette.mode === 'dark'
					? theme.palette.background.paper
					: theme.palette.background.paper,
			})}
		>
			<Stack spacing={2} sx={{ height: '100%' }}>
				{/* Header with period info */}
				<Box sx={{ 
					pb: 1.5, 
					borderBottom: '1px solid', 
					borderColor: 'divider',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between'
				}}>
					<Stack direction="row" alignItems="center" spacing={1}>
						<TrendingUpIcon sx={{ color: 'primary.main', fontSize: 20 }} />
						<Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
							Dashboard Attività
						</Typography>
					</Stack>
					<Chip 
						label={periodDisplay}
						size="small"
						sx={{
							fontWeight: 600,
							fontSize: '0.75rem',
							height: 24,
							bgcolor: (theme) => theme.palette.mode === 'dark' 
								? 'rgba(0, 166, 251, 0.12)' 
								: 'rgba(0, 166, 251, 0.08)',
							color: 'primary.main',
							borderRadius: 1.5,
						}}
					/>
				</Box>

				<Box sx={{ flex: 1, minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						{chartData.isDailyView ? (
							// Daily View: Commesse and Activities breakdown
							!chartData.isEmpty && chartData.dailyData?.length > 0 ? (
								<Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
									{/* Summary header - Enhanced with more stats */}
									<Stack direction="row" spacing={1.5}>
										{/* Total Hours Card */}
										<Paper 
											elevation={0}
											sx={{ 
												flex: 1.5,
												p: 2, 
												borderRadius: 2,
												border: '1px solid',
												borderColor: 'divider',
												bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
											}}
										>
											<Stack direction="row" alignItems="center" spacing={1.5}>
												<Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
													<WorkIcon />
												</Avatar>
												<Stack spacing={0}>
													<Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1 }}>
														{chartData.stats.totalHours.toFixed(1)}h
													</Typography>
													<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
														Ore Totali Lavorate
													</Typography>
												</Stack>
											</Stack>
										</Paper>

										{/* Commesse Count */}
										<Paper 
											elevation={0}
											sx={{ 
												flex: 1,
												p: 2, 
												borderRadius: 2,
												border: '1px solid',
												borderColor: 'divider',
												bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
											}}
										>
											<Stack spacing={0.5}>
												<Stack direction="row" alignItems="center" spacing={0.5}>
													<FolderIcon sx={{ fontSize: 20, color: '#34C759' }} />
													<Typography variant="h5" sx={{ fontWeight: 700, color: '#34C759', lineHeight: 1 }}>
														{chartData.stats.totalCommesse}
													</Typography>
												</Stack>
												<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
													{chartData.stats.totalCommesse === 1 ? 'Commessa' : 'Commesse'}
												</Typography>
												<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', fontWeight: 600 }}>
													{chartData.stats.avgHoursPerCommessa.toFixed(1)}h media
												</Typography>
											</Stack>
										</Paper>

										{/* Activities Count */}
										<Paper 
											elevation={0}
											sx={{ 
												flex: 1,
												p: 2, 
												borderRadius: 2,
												border: '1px solid',
												borderColor: 'divider',
												bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
											}}
										>
											<Stack spacing={0.5}>
												<Stack direction="row" alignItems="center" spacing={0.5}>
													<AssignmentIcon sx={{ fontSize: 20, color: '#FF9F0A' }} />
													<Typography variant="h5" sx={{ fontWeight: 700, color: '#FF9F0A', lineHeight: 1 }}>
														{chartData.stats.totalActivities}
													</Typography>
												</Stack>
												<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
													{chartData.stats.totalActivities === 1 ? 'Attività' : 'Attività'}
												</Typography>
												<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', fontWeight: 600 }}>
													Totali registrate
												</Typography>
											</Stack>
										</Paper>
									</Stack>

									{absenceCards && (
										<Box sx={{ px: 0.5 }}>
											{absenceCards}
										</Box>
									)}

									{completenessCardCompactElement && (
										<Box sx={{ px: 0.5 }}>
											{completenessCardCompactElement}
										</Box>
									)}

									{/* Commesse cards with activities */}
									<Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
										<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
											{chartData.dailyData.map((item) => {
												const { commessa, hours, activities, descrizione, cliente } = item;
												const commessaColor = getCommessaColor(commessa);
												const commessaBgColor = getCommessaColorLight(commessa, 0.08);
												const isSelected = selectedCommessa === commessa;
												const totalHours = chartData.dailyData.reduce((sum, i) => sum + i.hours, 0);
												const percentage = totalHours > 0 ? (hours / totalHours) * 100 : 0;

												return (
													<Paper
														key={commessa}
														elevation={isSelected ? 3 : 0}
														onClick={() => handleSelectCommessa(commessa)}
														sx={{
															borderRadius: 2,
															border: '1px solid',
															borderColor: isSelected ? commessaColor : 'divider',
															bgcolor: isSelected ? commessaBgColor : 'background.paper',
															cursor: 'pointer',
															overflow: 'hidden',
															transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
															'&:hover': {
																borderColor: commessaColor,
																bgcolor: commessaBgColor,
																transform: 'translateY(-1px)',
															},
														}}
													>
														{/* Commessa header */}
														<Box
															sx={{
																p: 2,
																bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.015)',
																borderBottom: '1px solid',
																borderColor: 'divider',
															}}
														>
															<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
																<Stack direction="row" alignItems="center" spacing={1.5}>
																	<Avatar 
																		sx={{ 
																			bgcolor: commessaColor, 
																			width: 36, 
																			height: 36,
																			fontSize: '0.9rem',
																			fontWeight: 700,
																		}}
																	>
																		<FolderIcon fontSize="small" />
																	</Avatar>
																	<Box>
																		<Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
																			{commessa}
																		</Typography>
																		{descrizione && (
																			<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', mb: 0.25 }}>
																				{descrizione}
																			</Typography>
																		)}
																		<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
																			{activities.length} {activities.length === 1 ? 'attività' : 'attività'}
																		</Typography>
																	</Box>
																</Stack>
																<Stack alignItems="flex-end" spacing={0.5}>
																	<Typography variant="h5" sx={{ fontWeight: 700, color: commessaColor, lineHeight: 1 }}>
																		{hours}h
																	</Typography>
																	<Chip
																		size="small"
																		label={`${percentage.toFixed(0)}%`}
																		sx={{
																			height: 18,
																			fontSize: '0.65rem',
																			fontWeight: 600,
																			bgcolor: commessaColor,
																			color: '#fff',
																		}}
																	/>
																</Stack>
															</Stack>
														</Box>

														{/* Activities list */}
														<Box sx={{ p: 1.5 }}>
															<Stack spacing={1}>
																{activities.map((activity, idx) => {
																	const activityPercentage = hours > 0 ? (activity.hours / hours) * 100 : 0;
																	
																	return (
																		<Box
																			key={idx}
																			sx={{
																				p: 1.5,
																				borderRadius: 1.5,
																				bgcolor: 'background.paper',
																				border: '1px solid',
																				borderColor: 'divider',
																				transition: 'all 0.2s',
																				'&:hover': {
																					borderColor: commessaColor,
																					bgcolor: commessaBgColor,
																				},
																			}}
																		>
																			<Stack spacing={1}>
																				<Stack direction="row" alignItems="center" justifyContent="space-between">
																					<Stack direction="row" alignItems="center" spacing={1}>
																						<AssignmentIcon sx={{ fontSize: 16, color: commessaColor }} />
																						<Typography 
																							variant="body2" 
																							sx={{ 
																								fontWeight: 600, 
																								fontSize: '0.8rem',
																								flex: 1,
																							}}
																						>
																							{activity.name}
																						</Typography>
																					</Stack>
																					<Stack direction="row" alignItems="center" spacing={0.5}>
																						<AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
																						<Typography 
																							variant="caption" 
																							sx={{ 
																								fontWeight: 700, 
																								color: commessaColor,
																								fontSize: '0.75rem',
																							}}
																						>
																							{activity.hours}h
																						</Typography>
																					</Stack>
																				</Stack>
																				
																				{/* Activity progress bar */}
																				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
																					<LinearProgress 
																						variant="determinate" 
																						value={activityPercentage} 
																						sx={{
																							flex: 1,
																							height: 4,
																							borderRadius: 2,
																							bgcolor: getCommessaColorLight(commessa, 0.15),
																							'& .MuiLinearProgress-bar': {
																								bgcolor: commessaColor,
																								borderRadius: 2,
																							},
																						}}
																					/>
																					<Typography 
																						variant="caption" 
																						sx={{ 
																							fontSize: '0.65rem', 
																							color: 'text.secondary',
																							fontWeight: 600,
																							minWidth: 35,
																							textAlign: 'right',
																						}}
																					>
																						{activityPercentage.toFixed(0)}%
																					</Typography>
																				</Box>
																			</Stack>
																		</Box>
																	);
																})}
															</Stack>
														</Box>
													</Paper>
												);
											})}
										</Box>
									</Box>
								</Box>
							) : (
								<Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
									{/* Empty Day - Show Assigned Commesse and Reminder */}
									<Stack spacing={2}>
										{/* Header with icon */}
										<Stack direction="row" alignItems="center" spacing={1.5} sx={{ pb: 1 }}>
											<Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
												<AssignmentIcon />
											</Avatar>
											<Stack spacing={0.5}>
												<Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
													Nessuna attività registrata
												</Typography>
												<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
													Ecco le tue commesse assegnate per iniziare
												</Typography>
											</Stack>
										</Stack>

										{/* Quick Action Reminder */}
										<Paper
											elevation={0}
											sx={{
												p: 2,
												borderRadius: 2,
												border: '1px solid',
												borderColor: 'info.main',
												bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.04)',
											}}
										>
											<Stack direction="row" spacing={1.5}>
												<TrendingUpIcon sx={{ fontSize: 24, color: 'info.main' }} />
												<Stack spacing={0.5}>
													<Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
														Promemoria
													</Typography>
													<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', lineHeight: 1.5 }}>
														Ricordati di registrare le ore lavorate per ogni commessa e attività svolta. 
														Clicca su una cella del calendario per iniziare.
													</Typography>
												</Stack>
											</Stack>
										</Paper>

										{completenessCardCompactElement && completenessCardCompactElement}

										{/* Assigned Commesse */}
										{assignedCommesse && assignedCommesse.length > 0 ? (
											<Stack spacing={1.5}>
												<Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
													Commesse Assegnate ({assignedCommesse.length})
												</Typography>
												<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
													{assignedCommesse.map((commessa, idx) => {
														const commessaName = commessa.nome || commessa;
														const commessaColor = getCommessaColor(commessaName);
														const commessaBgColor = getCommessaColorLight(commessaName, 0.08);
														
														return (
															<Paper
																key={idx}
																elevation={0}
																sx={{
																	borderRadius: 2,
																	border: '1px solid',
																	borderColor: 'divider',
																	bgcolor: 'background.paper',
																	overflow: 'hidden',
																	transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
																	'&:hover': {
																		borderColor: commessaColor,
																		bgcolor: commessaBgColor,
																		transform: 'translateY(-1px)',
																	},
																}}
															>
																{/* Commessa header */}
																<Box
																	sx={{
																		p: 2,
																		bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.015)',
																		borderBottom: '1px solid',
																		borderColor: 'divider',
																	}}
																>
																	<Stack direction="row" alignItems="center" spacing={1.5}>
																		<Avatar 
																			sx={{ 
																				bgcolor: commessaColor, 
																				width: 36, 
																				height: 36,
																				fontSize: '0.9rem',
																				fontWeight: 700,
																			}}
																		>
																			<FolderIcon fontSize="small" />
																		</Avatar>
																		<Box sx={{ flex: 1, minWidth: 0 }}>
																			<Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: '0.95rem' }}>
																				{commessaName}
																			</Typography>
																			{commessa.descrizione && (
																				<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
																					{commessa.descrizione}
																				</Typography>
																			)}
																		</Box>
																	</Stack>
																</Box>

																{/* Details section */}
																{(commessa.cliente || commessa.descrizione) && (
																	<Box sx={{ p: 1.5 }}>
																		{commessa.cliente && (
																			<Box
																				sx={{
																					p: 1.5,
																					borderRadius: 1.5,
																					bgcolor: 'background.paper',
																					border: '1px solid',
																					borderColor: 'divider',
																				}}
																			>
																				<Stack direction="row" alignItems="center" spacing={1}>
																					<FolderIcon sx={{ fontSize: 16, color: commessaColor }} />
																					<Typography 
																						variant="body2" 
																						sx={{ 
																							fontWeight: 600, 
																							fontSize: '0.8rem',
																							color: 'text.secondary',
																						}}
																					>
																						{commessa.cliente}
																					</Typography>
																				</Stack>
																			</Box>
																		)}
																	</Box>
																)}
															</Paper>
														);
													})}
												</Box>
											</Stack>
										) : (
											<Paper
												elevation={0}
												sx={{
													p: 3,
													borderRadius: 2,
													border: '1px dashed',
													borderColor: 'divider',
													bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
													textAlign: 'center'
												}}
											>
												<Stack spacing={1} alignItems="center">
													<AccessTimeIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
													<Typography variant="body2" sx={{ color: 'text.secondary' }}>
														Nessuna commessa assegnata al momento.
													</Typography>
													<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
														Contatta il tuo responsabile per le assegnazioni.
													</Typography>
												</Stack>
											</Paper>
										)}
									</Stack>
								</Box>
							)
						) : (
							// Period View: Bar chart with statistics
							!chartData.isEmpty && chartData.series.length > 0 ? (
								<Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
									{/* Two-column layout: Chart + Stats */}
									<Box sx={{ display: 'flex', gap: 2, px: 1, minHeight: 0, flex: 1 }}>
										{/* Left: Bar Chart */}
										<Box
											sx={{
												flex: '1 1 60%',
												minHeight: 320,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											<BarChart
												series={chartData.series}
												xAxis={[{
													scaleType: 'band',
													data: chartData.xAxis,
													categoryGapRatio: 0.3,
													barGapRatio: chartData.isStacked ? 0.15 : 0.4,
													label: chartData.xLabel,
												}]}
												yAxis={[{
													label: 'Ore',
												}]}
												width={chartData.width}
												height={320}
												margin={{ top: 24, right: 28, bottom: 80, left: 60 }}
												slotProps={{
													legend: {
														hidden: !chartData.isStacked,
													},
												}}
												sx={{
													'& .MuiBarElement-root': {
														transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
														'&:hover': {
															filter: 'brightness(1.15)',
															cursor: 'pointer',
														},
													},
													'& .MuiChartsAxis-tickLabel': {
														fontSize: '0.7rem',
													},
													'& .MuiChartsAxis-label': {
														fontSize: '0.75rem',
														fontWeight: 600,
													},
												}}
											/>
										</Box>

										{/* Right: Compact Stats Summary */}
										<Box sx={{ flex: '1 1 40%', minHeight: 0 }}>
											<Stack spacing={1.5} sx={{ height: '100%' }}>
												{/* Compact Stats Grid */}
												{chartData.stats && (
													<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
														{/* Total Hours */}
														<Paper 
															elevation={0}
															sx={{ 
																p: 1.5, 
																borderRadius: 2,
																border: '1px solid',
																borderColor: 'divider',
																bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
															}}
														>
															<Stack spacing={0.5}>
																<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
																	Ore Totali
																</Typography>
																<Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1, fontSize: '1.1rem' }}>
																	{chartData.stats.totalHours.toFixed(1)}h
																</Typography>
															</Stack>
														</Paper>

														{/* Days Worked */}
														<Paper 
															elevation={0}
															sx={{ 
																p: 1.5, 
																borderRadius: 2,
																border: '1px solid',
																borderColor: 'divider',
																bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
															}}
														>
															<Stack spacing={0.5}>
																<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
																	Giorni Lavorati
																</Typography>
																<Typography variant="h6" sx={{ fontWeight: 700, color: '#34C759', lineHeight: 1, fontSize: '1.1rem' }}>
																	{chartData.stats.daysWorked}
																</Typography>
															</Stack>
														</Paper>

														{/* Average Hours */}
														<Paper 
															elevation={0}
															sx={{ 
																p: 1.5, 
																borderRadius: 2,
																border: '1px solid',
																borderColor: 'divider',
																bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
															}}
														>
															<Stack spacing={0.5}>
																<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
																	Media/Giorno
																</Typography>
																<Typography variant="h6" sx={{ fontWeight: 700, color: '#FF9F0A', lineHeight: 1, fontSize: '1.1rem' }}>
																	{chartData.stats.avgHoursPerDay.toFixed(1)}h
																</Typography>
															</Stack>
														</Paper>

														{/* Completeness Card - Compact Horizontal */}
														{completenessCardCompactElement}
													</Box>
												)}

												{/* Trend Indicator - Compact */}
												{chartData.stats?.trend && (
													<Paper
														elevation={0}
														sx={{
															p: 1.5,
															borderRadius: 2,
															border: '1px solid',
															borderColor: 'divider',
															bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
														}}
													>
														<Stack direction="row" alignItems="center" justifyContent="space-between">
															<Stack direction="row" alignItems="center" spacing={1}>
																<Avatar 
																	sx={{ 
																		width: 28, 
																		height: 28,
																		bgcolor: chartData.stats.trend.isIncreasing ? '#34C759' : '#FF453A',
																	}}
																>
																	<TrendingUpIcon 
																		sx={{ 
																			fontSize: 16,
																			transform: chartData.stats.trend.isIncreasing ? 'none' : 'rotate(180deg)',
																		}} 
																	/>
																</Avatar>
																<Box>
																	<Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem', lineHeight: 1.2 }}>
																		Trend media giornaliera
																	</Typography>
																	<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem' }}>
																		vs {chartData.stats.trend.label || 'periodo precedente'} · {chartData.stats.trend.previousAvg.toFixed(1)}h → {chartData.stats.trend.currentAvg.toFixed(1)}h
																	</Typography>
																</Box>
															</Stack>
															<Typography 
																variant="h6" 
																sx={{ 
																	fontWeight: 700, 
																	color: chartData.stats.trend.isIncreasing ? '#34C759' : '#FF453A',
																	lineHeight: 1,
																	fontSize: '1rem'
																}}
															>
																{chartData.stats.trend.isIncreasing ? '+' : ''}{chartData.stats.trend.percentage.toFixed(1)}%
															</Typography>
														</Stack>
													</Paper>
												)}

												{absenceCards && (
													<Box>
														{absenceCards}
													</Box>
												)}
											</Stack>
										</Box>
									</Box>

									{/* Detailed Breakdown Section - Now at bottom */}
									{chartData.stats.commessaBreakdown && chartData.stats.commessaBreakdown.length > 0 && (
										<Box sx={{ px: 1, pt: 2 }}>
											<Stack spacing={1.5}>
												{/* Commesse Breakdown List */}
												<Paper
													elevation={0}
													sx={{
														p: 1.5,
														borderRadius: 2,
														border: '1px solid',
														borderColor: 'divider',
													}}
												>
													<Stack spacing={1}>
														<Stack direction="row" alignItems="center" justifyContent="space-between">
															<Typography variant="caption" sx={{ 
																fontWeight: 700, 
																fontSize: '0.7rem', 
																textTransform: 'uppercase', 
																letterSpacing: 0.8,
																color: 'text.secondary' 
															}}>
																Distribuzione per Commessa ({chartData.stats.totalCommesse})
															</Typography>
															{totalBreakdownPages > 1 && (
																<Stack direction="row" alignItems="center" spacing={0.5}>
																	<IconButton 
																		size="small"
																		sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
																		onClick={handlePrevBreakdownPage}
																		disabled={breakdownPage === 0}
																	>
																		<ChevronLeftIcon fontSize="small" />
																	</IconButton>
																	<Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
																		{breakdownPage + 1}/{totalBreakdownPages}
																	</Typography>
																	<IconButton 
																		size="small"
																		sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
																		onClick={handleNextBreakdownPage}
																		disabled={breakdownPage >= totalBreakdownPages - 1}
																	>
																		<ChevronRightIcon fontSize="small" />
																	</IconButton>
																</Stack>
															)}
														</Stack>
						
														<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.2, minHeight: 260 }}>
															{pagedBreakdown.map((item, idx) => {
																const absoluteIndex = breakdownPage * BREAKDOWN_PAGE_SIZE + idx;
																const commessaColor = getCommessaColor(item.name);
																const commessaBgColor = getCommessaColorLight(item.name, 0.08);
																return (
																	<Box
																		key={`${item.name}-${absoluteIndex}`}
																		sx={{
																			p: 1.5,
																			borderRadius: 1.5,
																			bgcolor: (theme) => theme.palette.mode === 'dark' 
																				? 'rgba(255, 255, 255, 0.02)' 
																				: 'rgba(0, 0, 0, 0.02)',
																			border: '1px solid',
																			borderColor: 'divider',
																			transition: 'all 0.2s',
																			'&:hover': {
																				borderColor: commessaColor,
																				bgcolor: commessaBgColor,
																				transform: 'translateX(4px)',
																			},
																		}}
																	>
																		<Stack spacing={1}>
																			{/* Header */}
																			<Stack direction="row" alignItems="center" justifyContent="space-between">
																				<Stack direction="row" alignItems="center" spacing={1}>
																					<Chip
																						label={`#${absoluteIndex + 1}`}
																						size="small"
																						sx={{
																							height: 18,
																							fontSize: '0.65rem',
																							fontWeight: 700,
																							minWidth: 30,
																							bgcolor: commessaColor,
																							color: '#fff',
																						}}
																					/>
																					<Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
																						{item.name}
																					</Typography>
																				</Stack>
																				<Stack direction="row" alignItems="center" spacing={1}>
																					<Chip
																						label={`${item.percentage.toFixed(1)}%`}
																						size="small"
																						sx={{
																							height: 18,
																							fontSize: '0.65rem',
																							fontWeight: 600,
																							bgcolor: (theme) => theme.palette.mode === 'dark'
																								? 'rgba(0, 166, 251, 0.15)'
																								: 'rgba(0, 166, 251, 0.1)',
																							color: 'primary.main',
																						}}
																					/>
																					<Typography variant="h6" sx={{ fontWeight: 700, color: commessaColor, fontSize: '0.95rem' }}>
																						{item.hours.toFixed(1)}h
																					</Typography>
																				</Stack>
																			</Stack>

																			{/* Trend for commessa */}
																			<Stack direction="row" alignItems="center" spacing={1}>
																				<Avatar
																					sx={{
																						width: 28,
																					height: 28,
																					bgcolor: item.trend.isIncreasing ? '#34C759' : '#FF453A',
																				}}
																				>
																					<TrendingUpIcon
																						sx={{
																						fontSize: 16,
																						transform: item.trend.isIncreasing ? 'none' : 'rotate(180deg)',
																					}}
																					/>
																				</Avatar>
																				<Stack spacing={0.25}>
																					<Typography
																						variant="caption"
																						sx={{ fontWeight: 600, fontSize: '0.65rem', color: item.trend.isIncreasing ? '#34C759' : '#FF453A' }}
																				>
																						{item.trend.isIncreasing ? 'In crescita' : 'In calo'} {item.trend.value >= 0 ? '+' : ''}{item.trend.value.toFixed(1)}h
																					</Typography>
																					<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
																						{item.trend.firstAvg.toFixed(1)}h → {item.trend.secondAvg.toFixed(1)}h media
																					</Typography>
																				</Stack>
																				<Chip
																					size="small"
																					label={`${item.trend.percentage >= 0 ? '+' : ''}${item.trend.percentage.toFixed(1)}%`}
																					sx={{
																						height: 18,
																						fontSize: '0.65rem',
																						fontWeight: 600,
																						bgcolor: (theme) => item.trend.isIncreasing
																							? 'rgba(52, 199, 89, 0.15)'
																							: 'rgba(255, 69, 58, 0.15)',
																						color: item.trend.isIncreasing ? '#1C8F3E' : '#FF453A',
																					}}
																				/>
																			</Stack>

																			{/* Progress Bar */}
																			<LinearProgress
																				variant="determinate"
																				value={item.percentage}
																				sx={{
																					height: 6,
																					borderRadius: 3,
																					bgcolor: (theme) => theme.palette.mode === 'dark'
																						? 'rgba(255, 255, 255, 0.05)'
																						: 'rgba(0, 0, 0, 0.05)',
																					'& .MuiLinearProgress-bar': {
																						bgcolor: commessaColor,
																						borderRadius: 3,
																					},
																				}}
																			/>

																			{/* Stats Row */}
																			<Stack direction="row" spacing={2}>
																				<Stack direction="row" alignItems="center" spacing={0.5}>
																					<CheckCircleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
																					<Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
																						<strong>{item.daysActive}</strong> {item.daysActive === 1 ? 'giorno' : 'giorni'} attivi
																					</Typography>
																				</Stack>
																				<Stack direction="row" alignItems="center" spacing={0.5}>
																					<AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
																					<Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
																						<strong>{item.avgPerActiveDay.toFixed(1)}h</strong> media/giorno
																					</Typography>
																				</Stack>
																			</Stack>

																			{/* Activities List */}
																			{item.activities && item.activities.length > 0 && (
																				<Box>
																					<Divider sx={{ my: 1 }} />
																					<Stack spacing={0.75}>
																						<Typography variant="caption" sx={{ 
																							fontWeight: 700, 
																							fontSize: '0.65rem', 
																							textTransform: 'uppercase', 
																							letterSpacing: 0.5,
																							color: 'text.secondary' 
																						}}>
																							Attività ({item.activities.length})
																						</Typography>
																						{item.activities.map((activity, actIdx) => {
																							const activityPercentage = item.hours > 0 ? (activity.hours / item.hours) * 100 : 0;
																							return (
																								<Stack 
																									key={actIdx} 
																									direction="row" 
																									alignItems="center" 
																									spacing={1}
																									sx={{
																										p: 0.75,
																										borderRadius: 1,
																										bgcolor: 'background.paper',
																										border: '1px solid',
																										borderColor: 'divider',
																									}}
																								>
																									<AssignmentIcon sx={{ fontSize: 14, color: commessaColor }} />
																									<Typography 
																										variant="caption" 
																										sx={{ 
																											flex: 1,
																											fontSize: '0.7rem',
																											fontWeight: 500,
																										}}
																									>
																										{activity.name}
																									</Typography>
																									<Stack direction="row" alignItems="center" spacing={0.5}>
																										<Typography 
																											variant="caption" 
																											sx={{ 
																												fontSize: '0.65rem',
																												fontWeight: 700,
																												color: commessaColor,
																											}}
																										>
																											{activity.hours.toFixed(1)}h
																										</Typography>
																										<Chip
																											size="small"
																											label={`${activityPercentage.toFixed(0)}%`}
																											sx={{
																												height: 16,
																												fontSize: '0.6rem',
																												fontWeight: 600,
																												bgcolor: commessaBgColor,
																												color: commessaColor,
																											}}
																										/>
																									</Stack>
																								</Stack>
																							);
																						})}
																					</Stack>
																				</Box>
																			)}
																		</Stack>
																	</Box>
																);
															})}
														</Box>
													</Stack>
												</Paper>
											</Stack>
										</Box>
									)}
								</Box>
							) : (
								<Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<Typography variant="body2" sx={{ color: 'text.secondary' }}>
										Nessun dato nel periodo selezionato.
									</Typography>
								</Box>
							)
						)}
				</Box>
			</Stack>
		</Paper>
	);
}

CommesseDashboard.propTypes = {
	assignedCommesse: PropTypes.array,
	data: PropTypes.object,
	period: PropTypes.oneOf(['week', 'month', 'year', 'none']),
	refDate: PropTypes.instanceOf(Date),
	onPeriodChange: PropTypes.func,
	onCommessaSelect: PropTypes.func,
};
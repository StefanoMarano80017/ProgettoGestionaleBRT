import React, { useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, Paper, IconButton, Tabs, Tab, ToggleButtonGroup, ToggleButton, LinearProgress, Chip, Divider, Avatar } from '@mui/material';
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
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { parseKeyToDate, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, inRange } from '@/shared/utils/dateRangeUtils';
import { BarChart } from '@mui/x-charts/BarChart';
import { getCommessaColor, getCommessaColorLight } from '@shared/utils/commessaColors';

const NON_WORK_COMMESSE = new Set(['FERIE', 'MALATTIA', 'PERMESSO', 'ROL', 'ROL_P', 'ROL_C', 'ROL_F']);

export default function CommesseDashboard({ assignedCommesse = [], data = {}, period = 'month', refDate = new Date(), onPeriodChange, onCommessaSelect }) {
	const [selectedCommessa, setSelectedCommessa] = useState(null);
	const handlePeriodToggle = useCallback((event, nextValue) => {
		if (!onPeriodChange) return;
		if (nextValue === null) {
			onPeriodChange('none');
			return;
		}
		onPeriodChange(nextValue);
	}, [onPeriodChange]);
	const range = useMemo(() => {
		if (period === 'week') return { start: startOfWeek(refDate), end: endOfWeek(refDate) };
		if (period === 'year') return { start: startOfYear(refDate), end: endOfYear(refDate) };
		if (period === 'none') {
			const start = new Date(refDate);
			start.setHours(0, 0, 0, 0);
			const end = new Date(refDate);
			end.setHours(23, 59, 59, 999);
			return { start, end };
		}
		return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
	}, [period, refDate]);
	const chartData = useMemo(() => {
		if (period === 'none') {
			const dayKey = refDate.toISOString().slice(0, 10);
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

			// Create detailed daily data with activities
			const dailyData = entries.map(([commessa, data]) => ({
				commessa,
				hours: data.total,
				activities: Array.from(data.activities.entries()).map(([name, hours]) => ({ name, hours })),
			}));

			return {
				series,
				xAxis: commessaList,
				isEmpty: false,
				isStacked: false,
				xLabel: 'Commesse',
				width: Math.max(360, commessaList.length * 70),
				isDailyView: true,
				dailyData, // Store detailed activity data
			};
		}

		const bucketMap = new Map(); // bucketKey -> { date: Date, values: Map(commessa -> hours) }
		const commessaSet = new Set();

		Object.entries(data || {}).forEach(([key, records]) => {
			if (key.endsWith('_segnalazione')) return;
			const currentDate = parseKeyToDate(key);
			if (!inRange(currentDate, range.start, range.end)) return;

			let bucketKey;
			let bucketDate;
			if (period === 'week') {
				bucketKey = currentDate.toISOString().slice(0, 10);
				bucketDate = currentDate;
			} else if (period === 'month') {
				const weekStart = startOfWeek(currentDate);
				bucketKey = weekStart.toISOString().slice(0, 10);
				bucketDate = weekStart;
			} else {
				const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
				bucketKey = monthStart.toISOString().slice(0, 10);
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
				commessaSet.add(commessa);
				bucket.values.set(commessa, (bucket.values.get(commessa) || 0) + hours);
			});
		});

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

		return {
			series,
			xAxis,
			isEmpty: false,
			isStacked: true,
			xLabel: period === 'week' ? 'Giorni' : period === 'month' ? 'Settimane' : 'Mesi',
			width: Math.max(400, buckets.length * 60),
			isDailyView: false,
		};
	}, [data, period, range, refDate]);
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
				else if (c === 'ROL') { acc.rol.hours += ore; if (!seen.rol) { acc.rol.days += 1; seen.rol = true; } }
			});
		});
		return acc;
	}, [data, range]);
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
			return refDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
		}
		return '';
	}, [period, range, refDate]);
	const handleSelectCommessa = (comm) => {
		const next = selectedCommessa === comm ? null : comm;
		setSelectedCommessa(next);
		if (typeof onCommessaSelect === 'function') onCommessaSelect(next);
	};
	return (
		<Paper sx={{ p: 2, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
			<Stack spacing={1} sx={{ height: '100%' }}>
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					<Box sx={{ flex: '1 1 280px', minWidth: 0, minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						{chartData.isDailyView ? (
							// Daily View: Commesse and Activities breakdown
							!chartData.isEmpty && chartData.dailyData?.length > 0 ? (
								<Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
									{/* Summary header */}
									<Paper 
										elevation={0}
										sx={{ 
											p: 2, 
											borderRadius: 2,
											border: '1px solid',
											borderColor: 'divider',
											background: 'linear-gradient(135deg, rgba(0, 166, 251, 0.08) 0%, rgba(0, 100, 148, 0.08) 100%)',
										}}
									>
										<Stack direction="row" alignItems="center" justifyContent="space-between">
											<Stack direction="row" alignItems="center" spacing={1.5}>
												<Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
													<WorkIcon />
												</Avatar>
												<Box>
													<Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
														{chartData.dailyData.length} {chartData.dailyData.length === 1 ? 'Commessa' : 'Commesse'}
													</Typography>
													<Typography variant="caption" sx={{ color: 'text.secondary' }}>
														Attive oggi
													</Typography>
												</Box>
											</Stack>
											<Box sx={{ textAlign: 'right' }}>
												<Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1 }}>
													{chartData.dailyData.reduce((sum, item) => sum + item.hours, 0)}h
												</Typography>
												<Typography variant="caption" sx={{ color: 'text.secondary' }}>
													Totale
												</Typography>
											</Box>
										</Stack>
									</Paper>

									{/* Commesse cards with activities */}
									<Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
										<Stack spacing={2}>
											{chartData.dailyData.map((item) => {
												const { commessa, hours, activities } = item;
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
																transform: 'translateY(-2px)',
																boxShadow: `0 4px 12px ${commessaBgColor}`,
															},
														}}
													>
														{/* Commessa header */}
														<Box
															sx={{
																p: 2,
																background: `linear-gradient(135deg, ${commessaBgColor} 0%, ${getCommessaColorLight(commessa, 0.03)} 100%)`,
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
										</Stack>
									</Box>
								</Box>
							) : (
								<Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<Typography variant="body2" sx={{ color: 'text.secondary' }}>
										Nessuna attività registrata oggi.
									</Typography>
								</Box>
							)
						) : (
							// Period View: Bar chart
							!chartData.isEmpty && chartData.series.length > 0 ? (
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
									height={280}
									margin={{ top: 20, right: 24, bottom: 70, left: 60 }}
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
							) : (
								<Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<Typography variant="body2" sx={{ color: 'text.secondary' }}>
										Nessun dato nel periodo selezionato.
									</Typography>
								</Box>
							)
						)}
					</Box>
					<Box sx={{ 
						width: { xs: '100%', sm: 320 }, 
						bgcolor: 'background.paper', 
						borderRadius: 2,
						overflow: 'hidden',
						border: '1px solid',
						borderColor: 'divider'
					}}>
						<Stack spacing={0}>
							{/* Header - Compact */}
							<Box sx={{ 
								bgcolor: 'background.paper',
								px: 2,
								py: 1.5,
								borderBottom: '1px solid',
								borderColor: 'divider'
							}}>
								<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
									<Box>
										<Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.9rem' }}>
											Riepilogo
										</Typography>
										<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
											{periodDisplay}
										</Typography>
									</Box>
									<ToggleButtonGroup
										value={period === 'none' ? null : period}
										exclusive
										size="small"
										onChange={handlePeriodToggle}
										sx={{
											'& .MuiToggleButton-root': {
												fontSize: '0.65rem',
												px: 0.75,
												py: 0.25,
												minWidth: 'auto',
												fontWeight: 600,
												borderRadius: 1,
												color: 'text.secondary',
												borderColor: 'divider',
												'&.Mui-selected': {
													color: 'primary.main',
													bgcolor: 'primary.lighter',
													borderColor: 'primary.main',
												'&:hover': {
													bgcolor: 'primary.light'
													}
												},
												'&:hover': {
													borderColor: 'primary.main',
													bgcolor: 'action.hover'
												}
											}
										}}
									>
										<ToggleButton value="week">
											Sett
										</ToggleButton>
										<ToggleButton value="month">
											Mese
										</ToggleButton>
										<ToggleButton value="year">
											Anno
										</ToggleButton>
									</ToggleButtonGroup>
								</Stack>
							</Box>

							{/* Absence Stats - Compact */}
							<Box sx={{ px: 2, py: 1.5 }}>
								<Typography variant="caption" sx={{ 
									color: 'text.secondary', 
									fontWeight: 600, 
									textTransform: 'uppercase',
									fontSize: '0.65rem',
									letterSpacing: 0.5,
									mb: 1,
									display: 'block'
								}}>
									Assenze
								</Typography>
								<Stack spacing={0.75}>
									{/* Ferie */}
									<Box sx={{ 
										display: 'flex', 
										alignItems: 'center', 
										gap: 1,
										p: 0.75,
										borderRadius: 1,
										bgcolor: 'rgba(216, 49, 91, 0.05)',
										border: '1px solid rgba(216, 49, 91, 0.15)',
										transition: 'all 0.2s',
										'&:hover': {
											bgcolor: 'rgba(216, 49, 91, 0.1)',
											transform: 'translateX(4px)'
										}
									}}>
										<Box sx={{ 
											display: 'flex', 
											alignItems: 'center', 
											justifyContent: 'center',
											width: 24,
											height: 24,
											borderRadius: 1,
											bgcolor: '#D8315B',
											color: 'white',
											flexShrink: 0
										}}>
											<BeachAccessIcon sx={{ fontSize: 14 }} />
										</Box>
										<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', minWidth: 60 }}>
											Ferie
										</Typography>
										<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', ml: 'auto' }}>
											{riepilogo.ferie.days || 0}g • {riepilogo.ferie.hours || 0}h
										</Typography>
									</Box>

									{/* Malattia */}
									<Box sx={{ 
										display: 'flex', 
										alignItems: 'center', 
										gap: 1,
										p: 0.75,
										borderRadius: 1,
										bgcolor: 'rgba(52, 199, 89, 0.05)',
										border: '1px solid rgba(52, 199, 89, 0.15)',
										transition: 'all 0.2s',
										'&:hover': {
											bgcolor: 'rgba(52, 199, 89, 0.1)',
											transform: 'translateX(4px)'
										}
									}}>
										<Box sx={{ 
											display: 'flex', 
											alignItems: 'center', 
											justifyContent: 'center',
											width: 24,
											height: 24,
											borderRadius: 1,
											bgcolor: '#34C759',
											color: 'white',
											flexShrink: 0
										}}>
											<LocalHospitalIcon sx={{ fontSize: 14 }} />
										</Box>
										<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', minWidth: 60 }}>
											Malattia
										</Typography>
										<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', ml: 'auto' }}>
											{riepilogo.malattia.days || 0}g • {riepilogo.malattia.hours || 0}h
										</Typography>
									</Box>

									{/* Permesso */}
									<Box sx={{ 
										display: 'flex', 
										alignItems: 'center', 
										gap: 1,
										p: 0.75,
										borderRadius: 1,
										bgcolor: 'rgba(2, 136, 209, 0.05)',
										border: '1px solid rgba(2, 136, 209, 0.15)',
										transition: 'all 0.2s',
										'&:hover': {
											bgcolor: 'rgba(2, 136, 209, 0.1)',
											transform: 'translateX(4px)'
										}
									}}>
										<Box sx={{ 
											display: 'flex', 
											alignItems: 'center', 
											justifyContent: 'center',
											width: 24,
											height: 24,
											borderRadius: 1,
											bgcolor: '#0288d1',
											color: 'white',
											flexShrink: 0
										}}>
											<ScheduleIcon sx={{ fontSize: 14 }} />
										</Box>
										<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', minWidth: 60 }}>
											Permesso
										</Typography>
										<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', ml: 'auto' }}>
											{riepilogo.permesso.days || 0}g • {riepilogo.permesso.hours || 0}h
										</Typography>
									</Box>

									{/* ROL */}
									<Box sx={{ 
										display: 'flex', 
										alignItems: 'center', 
										gap: 1,
										p: 0.75,
										borderRadius: 1,
										bgcolor: 'rgba(2, 136, 209, 0.05)',
										border: '1px solid rgba(2, 136, 209, 0.15)',
										transition: 'all 0.2s',
										'&:hover': {
											bgcolor: 'rgba(2, 136, 209, 0.1)',
											transform: 'translateX(4px)'
										}
									}}>
										<Box sx={{ 
											display: 'flex', 
											alignItems: 'center', 
											justifyContent: 'center',
											width: 24,
											height: 24,
											borderRadius: 1,
											bgcolor: '#0288d1',
											color: 'white',
											flexShrink: 0
										}}>
											<EventBusyIcon sx={{ fontSize: 14 }} />
										</Box>
										<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', minWidth: 60 }}>
											ROL
										</Typography>
										<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', ml: 'auto' }}>
											{riepilogo.rol.days || 0}g • {riepilogo.rol.hours || 0}h
										</Typography>
									</Box>
								</Stack>
							</Box>

						</Stack>
					</Box>

				</Stack>
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
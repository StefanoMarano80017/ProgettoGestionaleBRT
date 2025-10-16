import React, { useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, Paper, Chip, Divider, IconButton, Tabs, Tab, ToggleButtonGroup, ToggleButton } from '@mui/material';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { parseKeyToDate, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, inRange } from '@/shared/utils/dateRangeUtils';
import { PieChart } from '@mui/x-charts/PieChart';
import { getCommessaColor, getCommessaColorLight } from '@shared/utils/commessaColors';

export default function CommesseDashboard({ assignedCommesse = [], data = {}, period = 'month', refDate = new Date(), onPeriodChange, onCommessaSelect }) {
	const [selectedCommessa, setSelectedCommessa] = useState(null);
	const [commesseFilter, setCommesseFilter] = useState('active'); // 'active' or 'closed'
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
	const listStats = useMemo(() => {
		const map = new Map();
		(assignedCommesse || []).forEach((c) => map.set(c, { commessa: c, total: 0, days: 0, lastDate: null }));
		Object.entries(data || {}).forEach(([key, records]) => {
			if (key.endsWith('_segnalazione')) return;
			const dayDate = parseKeyToDate(key);
			if (!inRange(dayDate, range.start, range.end)) return;
			const perDay = new Set();
			(records || []).forEach((rec) => {
				const comm = rec && rec.commessa;
				if (!comm || !map.has(comm)) return;
				const stat = map.get(comm);
				stat.total += Number(rec.ore || 0);
				if (!perDay.has(comm)) { stat.days += 1; perDay.add(comm); }
				if (!stat.lastDate || dayDate > stat.lastDate) stat.lastDate = dayDate;
			});
		});
		const allStats = Array.from(map.values()).sort((a, b) => String(a.commessa).localeCompare(String(b.commessa)));
		// Filter based on commesseFilter
		return allStats.filter((s) => {
			if (commesseFilter === 'active') return s.total > 0;
			if (commesseFilter === 'closed') return s.total === 0;
			return true;
		});
	}, [assignedCommesse, data, range, commesseFilter]);
	const chartData = useMemo(() => {
		const sums = new Map((assignedCommesse || []).map((c) => [c, 0]));
		Object.entries(data || {}).forEach(([key, records]) => {
			if (key.endsWith('_segnalazione')) return;
			const d = parseKeyToDate(key);
			if (!inRange(d, range.start, range.end)) return;
			(records || []).forEach((rec) => {
				if (!rec || !rec.commessa) return;
				if (!sums.has(rec.commessa)) return;
				sums.set(rec.commessa, sums.get(rec.commessa) + Number(rec.ore || 0));
			});
		});
		// Filter out commesse with 0 hours for cleaner pie chart
		const filteredEntries = Array.from(sums.entries()).filter(([, value]) => value > 0);
		const pieData = filteredEntries.map(([label, value], i) => ({
			id: i,
			value,
			label,
			color: getCommessaColor(label) // Use hash-based color
		}));
		return { pieData, labels: filteredEntries.map(([label]) => label), values: filteredEntries.map(([, value]) => value) };
	}, [assignedCommesse, data, range]);
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
			<Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontStyle: 'italic' }}>
				Dashboard delle commesse: visualizza il grafico a torta delle ore lavorate, il riepilogo con ferie/malattie/permessi/ROL, 
				i controlli per cambiare periodo (settimana/mese/anno), e l'elenco delle commesse assegnate con statistiche dettagliate.
			</Typography>
			<Stack spacing={1} sx={{ height: '100%' }}>
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					<Box sx={{ flex: '1 1 280px', minWidth: 0, minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						{chartData.pieData && chartData.pieData.length ? (
							<PieChart
								series={[
									{
										data: chartData.pieData,
										highlightScope: { fade: 'global', highlight: 'item' },
										faded: { 
											innerRadius: 70, 
											additionalRadius: -15, 
											color: '#999',
										},
										highlighted: {
											additionalRadius: 10,
										},
										paddingAngle: 3,
										cornerRadius: 0,
										innerRadius: 70,
										outerRadius: 110,
										arcLabel: (item) => `${item.value}h`,
										arcLabelMinAngle: 45,
									},
								]}
								width={400}
								height={280}
								margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
								sx={{
									'& .MuiPieArc-root': {
										stroke: 'none',
										transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
										'&:hover': {
											filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
											opacity: 1,
										},
										'&[data-highlighting="faded"]': {
											opacity: 0.4,
										},
										'&[data-highlighting="highlighted"]': {
											opacity: 1,
										},
									},
									'& .MuiChartsLegend-root': {
										display: 'none !important',
									},
								}}
							/>
						) : (
							<Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<Typography variant="body2">Nessun dato nel periodo selezionato.</Typography>
							</Box>
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
				
				<Divider />
				
				{/* Commesse List Section - Bordered Container */}
				<Box sx={{ 
					bgcolor: 'background.paper',
					borderRadius: 2,
					overflow: 'hidden',
					border: '1px solid',
					borderColor: 'divider',
					display: 'flex',
					flexDirection: 'column',
					flex: 1,
					minHeight: 0
				}}>
					{/* Header */}
					<Box sx={{ 
						bgcolor: 'background.paper',
						px: 2,
						py: 1.5,
						borderBottom: '1px solid',
						borderColor: 'divider'
					}}>
						<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
							<Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.9rem' }}>
								Commesse Assegnate
							</Typography>
							<Tabs
								value={commesseFilter}
								onChange={(e, newValue) => setCommesseFilter(newValue)}
								sx={{
									minHeight: 28,
									'& .MuiTabs-indicator': {
										height: 2,
										borderRadius: '2px 2px 0 0'
									},
									'& .MuiTab-root': {
										fontSize: '0.65rem',
										textTransform: 'none',
										minHeight: 28,
										minWidth: 'auto',
										fontWeight: 600,
										px: 1.5,
										py: 0.5,
										color: 'text.secondary',
										transition: 'all 0.2s',
										'&:hover': {
											color: 'primary.main',
											bgcolor: 'action.hover',
										},
										'&.Mui-selected': {
											color: 'primary.main',
											fontWeight: 700,
										},
									},
								}}
							>
								<Tab label="Attive" value="active" />
								<Tab label="Chiuse" value="closed" />
							</Tabs>
						</Stack>
					</Box>
					
					{/* Scrollable list */}
					<Box sx={{ overflowY: 'auto', flex: 1, px: 2, py: 1.5, bgcolor: 'background.default' }}>
						<Stack spacing={0.75}>
						{(listStats || []).map((s) => {
							const commessaColor = getCommessaColor(s.commessa);
							const commessaBgColor = getCommessaColorLight(s.commessa, 0.08);
							
							return (
							<Box 
								key={s.commessa}
								onClick={() => handleSelectCommessa(s.commessa)} 
								tabIndex={0} 
								role="button" 
								aria-pressed={selectedCommessa === s.commessa} 
								sx={{ 
									p: 0.75, 
									display: 'flex', 
									alignItems: 'center', 
									justifyContent: 'space-between', 
									cursor: 'pointer',
									borderRadius: 1,
									border: '1px solid',
									borderColor: selectedCommessa === s.commessa ? commessaColor : 'rgba(0,0,0,0.08)',
									borderLeft: `3px solid ${commessaColor}`,
									bgcolor: selectedCommessa === s.commessa ? commessaBgColor : 'background.paper',
									boxShadow: selectedCommessa === s.commessa ? `0 2px 8px ${commessaBgColor}` : 'none',
									transition: 'all 0.2s',
									'&:hover': {
										bgcolor: commessaBgColor,
										borderColor: commessaColor,
										transform: 'translateX(4px)',
										boxShadow: `0 2px 8px ${commessaBgColor}`
									}
								}}
							>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
									{/* Color Dot */}
									<Box 
										sx={{ 
											width: 8, 
											height: 8, 
											borderRadius: '50%', 
											backgroundColor: commessaColor,
											flexShrink: 0,
											boxShadow: `0 0 0 2px ${commessaBgColor}`
										}} 
									/>
									<Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
										<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }} noWrap>{s.commessa}</Typography>
										<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
											{`${s.days}g • ${s.lastDate ? new Date(s.lastDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) : '—'}`}
										</Typography>
									</Box>
								</Box>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
									<Typography variant="caption" sx={{ 
										fontWeight: 700, 
										fontSize: '0.75rem',
										color: commessaColor,
										minWidth: 32,
										textAlign: 'right'
									}}>
										{s.total}h
									</Typography>
									{s.total > 0 ? (
										<Box sx={{ 
											width: 6, 
											height: 6, 
											borderRadius: '50%', 
											bgcolor: 'success.main',
											flexShrink: 0
										}} />
									) : (
										<Box sx={{ 
											width: 6, 
											height: 6, 
											borderRadius: '50%', 
											bgcolor: 'text.disabled',
											flexShrink: 0
										}} />
									)}
									<IconButton 
										size="small" 
										onClick={(e) => {
											e.stopPropagation();
											// TODO: Navigate to commessa detail page
											console.log('Navigate to commessa:', s.commessa);
										}}
										sx={{ 
											ml: 0.5,
											padding: '2px',
											'&:hover': {
												color: commessaColor
											}
										}}
										aria-label={`Apri pagina della commessa ${s.commessa}`}
									>
										<OpenInNewIcon sx={{ fontSize: 14 }} />
									</IconButton>
								</Box>
							</Box>
							);
						})}
						{(listStats || []).length === 0 && (
							<Box sx={{ py: 2, textAlign: 'center' }}>
								<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
									{commesseFilter === 'active' ? 'Nessuna commessa attiva nel periodo selezionato.' : 'Nessuna commessa chiusa.'}
								</Typography>
							</Box>
						)}
					</Stack>
				</Box>
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
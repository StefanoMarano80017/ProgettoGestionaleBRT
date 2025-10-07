import React from 'react';
import { styled } from "@mui/material/styles";
import Switch, { switchClasses } from "@mui/material/Switch";
import PropTypes from 'prop-types';

const WIDTH = 48;
const HEIGHT = 24;
const THUMB = 20;

const StyledSwitch = styled(Switch)(() => ({
	width: WIDTH,
	height: HEIGHT,
	padding: 0,
	[`& .${switchClasses.switchBase}`]: {
		padding: 2,
		[`&.${switchClasses.checked}`]: {
			transform: `translateX(${WIDTH - THUMB - 4}px)`,
			[`& .${switchClasses.thumb}`]: { backgroundColor: '#fff' },
			[`& + .${switchClasses.track}`]: { backgroundColor: '#60A29B' },
		},
	},
	[`& .${switchClasses.thumb}`]: { width: THUMB, height: THUMB, boxShadow: 'none' },
	[`& .${switchClasses.track}`]: { borderRadius: 12, backgroundColor: '#ccc', opacity: 1 },
}));

export function ThemeSwitch({ checked = false, onChange }) {
	return <StyledSwitch checked={checked} onChange={onChange} />;
}

ThemeSwitch.propTypes = { checked: PropTypes.bool, onChange: PropTypes.func };

export default React.memo(ThemeSwitch);
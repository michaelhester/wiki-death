import cleanData from './clean-data';
import color from './color';
import tooltip from './tooltip';

let peopleData = null;

const $section = d3.select('#change');
const $figure = $section.select('figure');
const $table = $figure.select('table');
const $tbody = $table.select('tbody');
const $btn = $section.select('.btn');

let $tip = null;

let theadHeight = 0;

function formatComma(number) {
	return d3.format(',')(Math.round(number));
}

function formatPercent(number) {
	return d3.format(',.0%')(number);
}

function handleNameEnter(datum) {
	const m = d3.mouse(this);
	const [x, y] = d3.mouse($table.node());
	const pos = { x: 0, y: y - m[1] + theadHeight };
	tooltip.show({ el: $tip, d: datum, pos });
}

function setupChart() {
	peopleData.sort((a, b) => d3.descending(a.change, b.change));
	const extent = d3.extent(peopleData, d => d.change);
	const scale = d3
		.scaleLinear()
		.domain(extent)
		.range([0.1, 0.9]);

	const $tr = $tbody
		.selectAll('tr')
		.data(peopleData)
		.enter()
		.append('tr');

	$tr
		.append('td.name')
		.text(d => d.display)
		.on('mouseenter', handleNameEnter)
		.on('mouseleave', () => {
			tooltip.hide($tip);
		});
	$tr
		.append('td.avg.number')
		.text(d => formatComma(d.median_views_adjusted_bd_2));
	$tr
		.append('td.death.number')
		.text(d => formatComma(d.death_views_adjusted_2));
	$tr
		.append('td.change.number')
		.text((d, i) => {
			const f = formatPercent(d.change);
			return f.replace('%', '');
		})
		.st('background-color', d => {
			const [r, g, b] = color.primary.rgb;
			return `rgba(${r},${g}, ${b}, ${scale(d.change)})`;
		});
}

function setupTooltip() {
	$tip = tooltip.init({ container: $table });
	$table.on('mouseleave', () => {
		tooltip.hide($tip);
	});
}

function setupToggle() {
	$btn.on('click', () => {
		const truncated = $figure.classed('is-truncated');
		const text = truncated ? 'Collapse' : 'Show All';
		$btn.text(text);
		$figure.classed('is-truncated', !truncated);

		if (!truncated) {
			const y = +$btn.at('data-y');
			window.scrollTo(0, y);
		}

		$btn.at('data-y', window.scrollY);
	});
}

function loadData() {
	return new Promise((resolve, reject) => {
		const filenames = ['people'];
		const filepaths = filenames.map(f => `assets/data/${f}.csv`);
		d3.loadData(...filepaths, (err, response) => {
			if (err) reject(err);
			const tempPeopleData = cleanData.people(response[0]);
			peopleData = tempPeopleData.map(d => ({
				...d,
				change: d.death_views_adjusted_2 / d.median_views_adjusted_bd_2
			}));
			resolve();
		});
	});
}

function resize() {
	theadHeight = $table.select('thead').node().offsetHeight;
}

function init() {
	loadData().then(() => {
		resize();
		setupTooltip();
		setupChart();
		setupToggle();
	});
}

export default { init, resize };

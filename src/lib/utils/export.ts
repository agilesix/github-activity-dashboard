import { utils, writeFile } from 'xlsx';
import type { ActivityItem, ActivityType } from '$lib/types';
import { ACTIVITY_TYPE_LABELS } from '$lib/types';

// =======================================================================
// Types
// =======================================================================

export interface ExportMetadata {
	user: string;
	repos: string[];
	from: string;
	to: string;
	types: ActivityType[];
	exportedAt: string;
	activeTab: string;
	filters: {
		searchQuery: string;
		selectedRepos: string[];
		selectedLabels: string[];
		dateFilterFrom: string | null;
		dateFilterTo: string | null;
	};
	totalItems: number;
	filteredItems: number;
}

// =======================================================================
// Sheet builders
// =======================================================================

export function buildActivityRows(items: ActivityItem[]): {
	headers: string[];
	rows: (string | number)[][];
} {
	const headers = [
		'Type',
		'Number',
		'Title',
		'Repo',
		'State',
		'Date',
		'Assignees',
		'Labels',
		'URL'
	];

	const rows = items.map((item) => [
		ACTIVITY_TYPE_LABELS[item.type],
		item.number ? `#${item.number}` : '',
		item.title,
		item.repo,
		item.state ?? '',
		item.date.split('T')[0],
		(item.assignees ?? []).join(', '),
		(item.labels ?? []).join(', '),
		item.url
	]);

	return { headers, rows };
}

export function buildMetadataRows(meta: ExportMetadata): { headers: string[]; rows: string[][] } {
	const headers = ['Field', 'Value'];

	const rows = [
		['User', meta.user],
		['Repos', meta.repos.join(', ')],
		['Date Range', `${meta.from} to ${meta.to}`],
		['Activity Types', meta.types.map((t) => ACTIVITY_TYPE_LABELS[t]).join(', ')],
		['Active Tab', meta.activeTab],
		['Search Query', meta.filters.searchQuery || '(none)'],
		[
			'Filtered Repos',
			meta.filters.selectedRepos.length > 0 ? meta.filters.selectedRepos.join(', ') : '(all)'
		],
		[
			'Filtered Labels',
			meta.filters.selectedLabels.length > 0 ? meta.filters.selectedLabels.join(', ') : '(all)'
		],
		[
			'Date Filter',
			meta.filters.dateFilterFrom || meta.filters.dateFilterTo
				? `${meta.filters.dateFilterFrom ?? '...'} to ${meta.filters.dateFilterTo ?? '...'}`
				: '(none)'
		],
		['Total Items', String(meta.totalItems)],
		['Filtered Items', String(meta.filteredItems)],
		['Exported At', meta.exportedAt]
	];

	return { headers, rows };
}

// =======================================================================
// Export
// =======================================================================

export function exportActivityData(
	items: ActivityItem[],
	meta: ExportMetadata,
	filenamePrefix: string
): void {
	const wb = utils.book_new();

	// Activity sheet
	const activity = buildActivityRows(items);
	const activitySheet = utils.aoa_to_sheet([activity.headers, ...activity.rows]);
	activitySheet['!cols'] = activity.headers.map((h) =>
		h === 'Title' || h === 'URL' ? { wch: 50 } : h === 'Repo' ? { wch: 25 } : { wch: 16 }
	);
	utils.book_append_sheet(wb, activitySheet, 'Activity');

	// Query sheet
	const metadata = buildMetadataRows(meta);
	const metadataSheet = utils.aoa_to_sheet([metadata.headers, ...metadata.rows]);
	metadataSheet['!cols'] = [{ wch: 18 }, { wch: 60 }];
	utils.book_append_sheet(wb, metadataSheet, 'Query');

	writeFile(wb, `${filenamePrefix}.xlsx`);
}

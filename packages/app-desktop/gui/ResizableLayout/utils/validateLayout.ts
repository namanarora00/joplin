import produce from 'immer';
import iterateItems from './iterateItems';
import { LayoutItem, LayoutItemDirection } from './types';

function updateItemSize(itemIndex: number, itemDraft: LayoutItem, parent: LayoutItem) {
	if (!parent) return;

	// If a container has only one child, this child should not
	// have a width and height, and simply fill up the container
	if (parent.children.length === 1) {
		delete itemDraft.width;
		delete itemDraft.height;
	}

	// If all children of a container have a fixed width, the
	// latest child should have a flexible width (i.e. no "width"
	// property), so that it fills up the remaining space
	if (itemIndex === parent.children.length - 1) {
		let allChildrenAreSized = true;
		for (const child of parent.children) {
			if (parent.direction === LayoutItemDirection.Row) {
				if (!child.width) {
					allChildrenAreSized = false;
					break;
				}
			} else {
				if (!child.height) {
					allChildrenAreSized = false;
					break;
				}
			}
		}

		if (allChildrenAreSized) {
			if (parent.direction === LayoutItemDirection.Row) {
				delete itemDraft.width;
			} else {
				delete itemDraft.height;
			}
		}
	}
}

// All items should be resizable, except for the root and the latest child
// of a container.
function updateResizeRules(itemIndex: number, itemDraft: LayoutItem, parent: LayoutItem) {
	if (!parent) return;
	const isLastChild = itemIndex === parent.children.length - 1;
	itemDraft.resizableRight = parent.direction === LayoutItemDirection.Row && !isLastChild;
	itemDraft.resizableBottom = parent.direction === LayoutItemDirection.Column && !isLastChild;
}

// Container direction should alternate between row (for the root) and
// columns, then rows again.
function updateDirection(_itemIndex: number, itemDraft: LayoutItem, parent: LayoutItem) {
	if (!parent) {
		itemDraft.direction = LayoutItemDirection.Row;
	} else {
		itemDraft.direction = parent.direction === LayoutItemDirection.Row ? LayoutItemDirection.Column : LayoutItemDirection.Row;
	}
}

export default function validateLayout(layout: LayoutItem): LayoutItem {
	if (!layout) throw new Error('Layout is null');
	if (!layout.children || !layout.children.length) throw new Error('Root does not have children');

	return produce(layout, (draft: LayoutItem) => {
		draft.isRoot = true;

		iterateItems(draft, (itemIndex: number, itemDraft: LayoutItem, parent: LayoutItem) => {
			updateItemSize(itemIndex, itemDraft, parent);
			updateResizeRules(itemIndex, itemDraft, parent);
			updateDirection(itemIndex, itemDraft, parent);
			return true;
		});
	});
}

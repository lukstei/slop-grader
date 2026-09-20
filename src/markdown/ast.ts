/**
 * Based on https://github.com/croct-tech/md-lite-js
 * Copyright (c) Croct Tech - MIT License
 */

type MarkdownNodeMap = {
	text: {
		content: string;
	};
	heading: {
		depth: number;
		children: MarkdownNode[];
	};
	bold: {
		children: MarkdownNode;
	};
	italic: {
		children: MarkdownNode;
	};
	strike: {
		children: MarkdownNode;
	};
	code: {
		content: string;
	};
	link: {
		href: string;
		title?: string;
		children: MarkdownNode;
	};
	image: {
		src: string;
		alt: string;
	};
	paragraph: {
		children: MarkdownNode[];
	};
	list: {
		ordered: boolean;
		children: MarkdownNode[];
	};
	listItem: {
		children: MarkdownNode[];
	};
	fragment: {
		children: MarkdownNode[];
	};
};

export type MarkdownNodeType = keyof MarkdownNodeMap;

export type MarkdownNode<T extends MarkdownNodeType = MarkdownNodeType> = {
	[K in MarkdownNodeType]: MarkdownNodeMap[K] & {
		type: K;
		source: string;
	};
}[T];

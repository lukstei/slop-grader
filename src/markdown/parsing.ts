/**
 * Based on https://github.com/croct-tech/md-lite-js
 * Copyright (c) Croct Tech - MIT License
 */

import type { MarkdownNode } from "./ast.ts";

export function parse(markdown: string): MarkdownNode {
	return MarkdownParser.parse(markdown);
}

class MismatchError extends Error {
	public constructor() {
		super("Mismatched token");

		Object.setPrototypeOf(this, MismatchError.prototype);
	}
}

class MarkdownParser {
	private readonly chars: string[];

	private index = 0;

	private static readonly NEWLINE = ["\r\n", "\r", "\n"];

	private static readonly NEW_PARAGRAPH = MarkdownParser.NEWLINE.flatMap(
		(prefix) => MarkdownParser.NEWLINE.map((suffix) => prefix + suffix),
	);

	private constructor(input: string) {
		this.chars = [...input];
	}

	public static parse(input: string): MarkdownNode {
		return new MarkdownParser(input).parseNext();
	}

	public static parseInlines(input: string): MarkdownNode[] {
		if (input === "") return [];
		const inlines = new MarkdownParser(input).parseNext("", true);
		return inlines.type === "fragment" ? inlines.children : [inlines];
	}

	private parseNext(end = "", inlinesOnly = false): MarkdownNode {
		const root: MarkdownNode<"fragment"> = {
			type: "fragment",
			children: [],
			source: "",
		};

		const startIndex = this.index;

		let text = "";
		let lastBlockIndex = 0;

		let paragraphStartIndex = this.index;
		let textStartIndex = this.index;

		const flushParagraph = (endIndex: number) => {
			if (text !== "") {
				root.children.push({
					type: "text",
					content: text,
					source: this.getSlice(textStartIndex, endIndex),
				});
				text = "";
			}

			const inlineChildren = root.children.splice(lastBlockIndex);
			if (inlineChildren.length > 0) {
				const paragraph: MarkdownNode<"paragraph"> = {
					type: "paragraph",
					children: inlineChildren,
					source: this.getSlice(paragraphStartIndex, endIndex),
				};
				root.children.push(paragraph);
			}
			lastBlockIndex = root.children.length;
		};

		while (!this.done) {
			const escapedText = this.parseText("");

			if (escapedText !== "") {
				text += escapedText;

				continue;
			}

			if (
				end !== "" &&
				(this.matches(end) || this.matches(...MarkdownParser.NEWLINE))
			) {
				break;
			}

			const headingMatch =
				!inlinesOnly && end === "" && this.atLineStart()
					? this.matchHeadingPrefix()
					: null;
			if (headingMatch !== null) {
				flushParagraph(this.index);

				const headingStartIndex = this.index;
				this.advance(headingMatch.prefixLength);

				const inlines = this.parseNext("\n", true);
				const children =
					inlines.type === "fragment" ? inlines.children : [inlines];
				const headingEndIndex = this.index;

				this.stripTrailingHeadingHashes(children);

				while (MarkdownParser.NEWLINE.includes(this.current)) {
					this.advance();
				}

				root.children.push({
					type: "heading",
					depth: headingMatch.depth,
					children,
					source: this.getSlice(headingStartIndex, headingEndIndex),
				});
				lastBlockIndex = root.children.length;

				paragraphStartIndex = this.index;
				textStartIndex = this.index;

				continue;
			}

			const listMatch =
				!inlinesOnly && end === "" && this.atLineStart()
					? this.matchListPrefix()
					: null;
			if (listMatch !== null) {
				flushParagraph(this.index);

				const listNode = this.parseList(listMatch.ordered);
				root.children.push(listNode);
				lastBlockIndex = root.children.length;

				while (MarkdownParser.NEWLINE.includes(this.current)) {
					this.advance();
				}

				paragraphStartIndex = this.index;
				textStartIndex = this.index;

				continue;
			}

			if (!inlinesOnly && this.matches(...MarkdownParser.NEW_PARAGRAPH)) {
				const paragraphEndIndex = this.index;

				while (MarkdownParser.NEWLINE.includes(this.current)) {
					this.advance();
				}

				flushParagraph(paragraphEndIndex);

				paragraphStartIndex = this.index;
				textStartIndex = this.index;

				continue;
			}

			const nodeStartIndex = this.index;

			let node: MarkdownNode | null = null;

			try {
				node = this.parseCurrent();
			} catch (error) {
				if (!(error instanceof MismatchError)) {
					/* istanbul ignore next */
					throw error;
				}
			}

			if (node === null) {
				this.seek(nodeStartIndex);

				text += this.current;

				this.advance();

				continue;
			}

			if (text !== "") {
				root.children.push({
					type: "text",
					content: text,
					source: this.getSlice(textStartIndex, nodeStartIndex),
				});
			}

			text = "";

			textStartIndex = this.index;

			root.children.push(node);
		}

		if (lastBlockIndex > 0) {
			flushParagraph(this.index);
		} else {
			if (text !== "") {
				root.children.push({
					type: "text",
					content: text,
					source: this.getSlice(textStartIndex, this.index),
				});
			}
		}

		if (root.children.length === 1) {
			return root.children[0];
		}

		root.source = this.getSlice(startIndex, this.index);

		return root;
	}

	private stripTrailingHeadingHashes(children: MarkdownNode[]): void {
		const last = children[children.length - 1];
		if (last?.type === "text") {
			last.content = last.content.replace(/\s+#+\s*$/, "");
			if (!last.content.trim()) {
				children.pop();
			}
		}
	}

	private parseCurrent(): MarkdownNode | null {
		const char = this.lookAhead();
		const startIndex = this.index;

		switch (char) {
			case "*":
			case "_": {
				const delimiter = this.matches("**") ? "**" : char;

				this.advance(delimiter.length);

				const children = this.parseNext(delimiter, true);

				this.match(delimiter);

				return {
					type: delimiter.length === 1 ? "italic" : "bold",
					children,
					source: this.getSlice(startIndex, this.index),
				};
			}

			case "~": {
				this.match("~~");

				const children = this.parseNext("~~", true);

				this.match("~~");

				return {
					type: "strike",
					children,
					source: this.getSlice(startIndex, this.index),
				};
			}

			case "`": {
				if (this.matches("```")) {
					return null;
				}

				const delimiter = this.matches("``") ? "``" : "`";

				this.match(delimiter);

				const content = this.parseText(delimiter).trim();

				if (this.matches("```")) {
					return null;
				}

				this.match(delimiter);

				return {
					type: "code",
					content,
					source: this.getSlice(startIndex, this.index),
				};
			}

			case "!": {
				this.advance();

				this.match("[");

				const alt = this.parseText("]");

				this.match("](");

				const src = this.parseText(")");

				this.match(")");

				return {
					type: "image",
					src,
					alt,
					source: this.getSlice(startIndex, this.index),
				};
			}

			case "[": {
				this.advance();

				const label = this.parseNext("]", true);

				this.match("](");

				const href = this.parseText(")", '"');

				let title: string | undefined;

				if (this.matches('"')) {
					this.match('"');

					title = this.parseText('"');

					this.match('"');
				}

				this.match(")");

				return {
					type: "link",
					href: href.trim(),
					...(title !== undefined ? { title } : {}),
					children: label,
					source: this.getSlice(startIndex, this.index),
				};
			}

			default:
				return null;
		}
	}

	private parseText(...end: string[]): string {
		let text = "";

		while (!this.done) {
			if (this.current === "\\" && this.index + 1 < this.length) {
				this.advance();

				text += this.current;

				this.advance();

				continue;
			}

			if (
				end.some((token) => token === "" || this.matches(token)) ||
				this.matches(...MarkdownParser.NEWLINE)
			) {
				break;
			}

			text += this.current;

			this.advance();
		}

		return text;
	}

	private atLineStart(): boolean {
		if (this.index === 0) return true;
		const prev = this.chars[this.index - 1];
		return prev === "\n" || prev === "\r";
	}

	private matchHeadingPrefix(): { depth: number; prefixLength: number } | null {
		if (!this.atLineStart()) return null;
		const slice = this.getSlice(this.index, this.index + 64);
		const match = slice.match(/^[ ]{0,3}(#{1,6})(?:[ \t]+|(?=[\r\n]|$))/);
		if (!match) return null;
		return { depth: match[1].length, prefixLength: match[0].length };
	}

	private matchListPrefix(): { ordered: boolean; prefixLength: number } | null {
		if (!this.atLineStart()) return null;
		const slice = this.getSlice(this.index, this.index + 64);
		const match = slice.match(/^[ ]{0,3}(?:([*+-])|(\d{1,9}[.)]))[ \t]+/);
		if (!match) return null;
		return {
			ordered: match[2] !== undefined,
			prefixLength: match[0].length,
		};
	}

	private parseList(ordered: boolean): MarkdownNode<"list"> {
		const listStartIndex = this.index;
		const items: MarkdownNode[] = [];

		while (!this.done) {
			const prefix = this.matchListPrefix();
			if (prefix === null || prefix.ordered !== ordered) {
				break;
			}

			const itemStartIndex = this.index;
			this.advance(prefix.prefixLength);

			const lineParts: string[] = [this.readLineRest().trim()];
			let itemEndIndex = this.index;

			while (!this.done) {
				if (MarkdownParser.NEWLINE.includes(this.current)) {
					while (MarkdownParser.NEWLINE.includes(this.current)) {
						this.advance();
					}
					const nextPrefix = this.matchListPrefix();
					if (nextPrefix !== null && nextPrefix.ordered === ordered) {
						break;
					}
					this.seek(itemEndIndex);
					break;
				}

				if (this.atLineStart()) {
					if (
						this.matchHeadingPrefix() !== null ||
						this.matchListPrefix() !== null
					) {
						break;
					}

					const slice = this.getSlice(this.index, this.index + 64);
					const indentMatch = slice.match(/^[ ]{2,4}|\t/);
					if (indentMatch) {
						this.advance(indentMatch[0].length);
						lineParts.push(this.readLineRest().trim());
						itemEndIndex = this.index;
						continue;
					}
				}

				break;
			}

			const itemText = lineParts.join(" ");
			const inlines = MarkdownParser.parseInlines(itemText);

			items.push({
				type: "listItem",
				children: inlines,
				source: this.getSlice(itemStartIndex, itemEndIndex),
			});
		}

		return {
			type: "list",
			ordered,
			children: items,
			source: this.getSlice(listStartIndex, this.index),
		};
	}

	private readLineRest(): string {
		let line = "";
		while (!this.done && !MarkdownParser.NEWLINE.includes(this.current)) {
			line += this.current;
			this.advance();
		}
		if (this.matches("\r\n")) {
			this.advance(2);
		} else if (MarkdownParser.NEWLINE.includes(this.current)) {
			this.advance(1);
		}
		return line;
	}

	private get done(): boolean {
		return this.index >= this.length;
	}

	private get length(): number {
		return this.chars.length;
	}

	private get current(): string {
		return this.chars[this.index];
	}

	private advance(length = 1): void {
		this.index += length;
	}

	private seek(index: number): void {
		this.index = index;
	}

	private matches(...lookahead: string[]): boolean {
		return lookahead.some(
			(substring) => this.lookAhead(substring.length) === substring,
		);
	}

	private match(...lookahead: string[]): void {
		for (const substring of lookahead) {
			if (this.lookAhead(substring.length) === substring) {
				this.advance(substring.length);

				return;
			}
		}

		throw new MismatchError();
	}

	private lookAhead(length = 1): string {
		if (length === 1) {
			return this.current;
		}

		return this.getSlice(this.index, this.index + length);
	}

	private getSlice(start: number, end: number): string {
		return this.chars.slice(start, end).join("");
	}
}

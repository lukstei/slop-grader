import { describe, expect, it } from "vitest";
import type { MarkdownNode } from "./ast.ts";
import { parse } from "./parsing.ts";

describe("A Markdown parser function", () => {
	type ParsingScenario = {
		input: string;
		output: MarkdownNode;
	};

	it.each(
		Object.entries<ParsingScenario>({
			paragraphs: {
				input: "First paragraph.\n\nSecond paragraph.",
				output: {
					type: "fragment",
					source: "First paragraph.\n\nSecond paragraph.",
					children: [
						{
							type: "paragraph",
							source: "First paragraph.",
							children: [
								{
									type: "text",
									source: "First paragraph.",
									content: "First paragraph.",
								},
							],
						},
						{
							type: "paragraph",
							source: "Second paragraph.",
							children: [
								{
									type: "text",
									source: "Second paragraph.",
									content: "Second paragraph.",
								},
							],
						},
					],
				},
			},
			"paragraphs with different newlines": {
				input: "First\n\nSecond\r\rThird\r\n\r\nFourth",
				output: {
					type: "fragment",
					source: "First\n\nSecond\r\rThird\r\n\r\nFourth",
					children: [
						{
							type: "paragraph",
							source: "First",
							children: [
								{
									type: "text",
									source: "First",
									content: "First",
								},
							],
						},
						{
							type: "paragraph",
							source: "Second",
							children: [
								{
									type: "text",
									source: "Second",
									content: "Second",
								},
							],
						},
						{
							type: "paragraph",
							source: "Third",
							children: [
								{
									type: "text",
									source: "Third",
									content: "Third",
								},
							],
						},
						{
							type: "paragraph",
							source: "Fourth",
							children: [
								{
									type: "text",
									source: "Fourth",
									content: "Fourth",
								},
							],
						},
					],
				},
			},
			"paragraphs leading and trailing newlines": {
				input: "\n\n\r\nFirst paragraph.\n\n\r\nSecond paragraph.\n\n\r\n",
				output: {
					type: "fragment",
					source: "\n\n\r\nFirst paragraph.\n\n\r\nSecond paragraph.\n\n\r\n",
					children: [
						{
							type: "paragraph",
							source: "First paragraph.",
							children: [
								{
									type: "text",
									source: "First paragraph.",
									content: "First paragraph.",
								},
							],
						},
						{
							type: "paragraph",
							source: "Second paragraph.",
							children: [
								{
									type: "text",
									source: "Second paragraph.",
									content: "Second paragraph.",
								},
							],
						},
					],
				},
			},
			"empty paragraphs": {
				input: "\n\r\r\n",
				output: {
					type: "fragment",
					source: "\n\r\r\n",
					children: [],
				},
			},
			"paragraphs multiple newlines": {
				input: "\n\n\nFirst paragraph.\n\n\nSecond paragraph.\n\n\n\n",
				output: {
					type: "fragment",
					source: "\n\n\nFirst paragraph.\n\n\nSecond paragraph.\n\n\n\n",
					children: [
						{
							type: "paragraph",
							source: "First paragraph.",
							children: [
								{
									type: "text",
									source: "First paragraph.",
									content: "First paragraph.",
								},
							],
						},
						{
							type: "paragraph",
							source: "Second paragraph.",
							children: [
								{
									type: "text",
									source: "Second paragraph.",
									content: "Second paragraph.",
								},
							],
						},
					],
				},
			},
			"mixed paragraphs and text": {
				input: [
					"**First**\n_paragraph_",
					"[Second paragraph](ex)",
					"![Third paragraph](ex)",
					"Fourth paragraph",
				].join("\n\n"),
				output: {
					type: "fragment",
					source: [
						"**First**\n_paragraph_",
						"[Second paragraph](ex)",
						"![Third paragraph](ex)",
						"Fourth paragraph",
					].join("\n\n"),
					children: [
						{
							type: "paragraph",
							source: "**First**\n_paragraph_",
							children: [
								{
									type: "bold",
									source: "**First**",
									children: {
										type: "text",
										source: "First",
										content: "First",
									},
								},
								{
									type: "text",
									source: "\n",
									content: "\n",
								},
								{
									type: "italic",
									source: "_paragraph_",
									children: {
										type: "text",
										source: "paragraph",
										content: "paragraph",
									},
								},
							],
						},
						{
							type: "paragraph",
							source: "[Second paragraph](ex)",
							children: [
								{
									type: "link",
									source: "[Second paragraph](ex)",
									href: "ex",
									children: {
										type: "text",
										source: "Second paragraph",
										content: "Second paragraph",
									},
								},
							],
						},
						{
							type: "paragraph",
							source: "![Third paragraph](ex)",
							children: [
								{
									type: "image",
									source: "![Third paragraph](ex)",
									src: "ex",
									alt: "Third paragraph",
								},
							],
						},
						{
							type: "paragraph",
							source: "Fourth paragraph",
							children: [
								{
									type: "text",
									source: "Fourth paragraph",
									content: "Fourth paragraph",
								},
							],
						},
					],
				},
			},
			text: {
				input: "Hello, world!",
				output: {
					type: "text",
					source: "Hello, world!",
					content: "Hello, world!",
				},
			},
			bold: {
				input: "Hello, **world**!",
				output: {
					type: "fragment",
					source: "Hello, **world**!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "bold",
							source: "**world**",
							children: {
								type: "text",
								source: "world",
								content: "world",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"bold with start delimited escaped": {
				input: "Hello, \\**world**!",
				output: {
					type: "fragment",
					source: "Hello, \\**world**!",
					children: [
						{
							type: "text",
							source: "Hello, \\*",
							content: "Hello, *",
						},
						{
							type: "italic",
							source: "*world*",
							children: {
								type: "text",
								source: "world",
								content: "world",
							},
						},
						{
							type: "text",
							source: "*!",
							content: "*!",
						},
					],
				},
			},
			"bold with end delimited escaped": {
				input: "Hello, **world\\**!",
				output: {
					type: "fragment",
					source: "Hello, **world\\**!",
					children: [
						{
							type: "text",
							source: "Hello, *",
							content: "Hello, *",
						},
						{
							type: "italic",
							source: "*world\\**",
							children: {
								type: "text",
								source: "world\\*",
								content: "world*",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"bold with escaped asterisk": {
				input: "Hello, **wor\\*\\*ld**!",
				output: {
					type: "fragment",
					source: "Hello, **wor\\*\\*ld**!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "bold",
							source: "**wor\\*\\*ld**",
							children: {
								type: "text",
								source: "wor\\*\\*ld",
								content: "wor**ld",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"bold with newline": {
				input: "Hello, **\nworld**!",
				output: {
					type: "text",
					source: "Hello, **\nworld**!",
					content: "Hello, **\nworld**!",
				},
			},
			"bold unbalanced": {
				input: "Hello, **world***!",
				output: {
					type: "fragment",
					source: "Hello, **world***!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "bold",
							source: "**world**",
							children: {
								type: "text",
								source: "world",
								content: "world",
							},
						},
						{
							type: "text",
							source: "*!",
							content: "*!",
						},
					],
				},
			},
			"italic (underscore)": {
				input: "Hello, _world_!",
				output: {
					type: "fragment",
					source: "Hello, _world_!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "italic",
							source: "_world_",
							children: {
								type: "text",
								source: "world",
								content: "world",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"italic with start delimited escaped (underscore)": {
				input: "Hello, \\_world_!",
				output: {
					type: "text",
					source: "Hello, \\_world_!",
					content: "Hello, _world_!",
				},
			},
			"italic with end delimited escaped (underscore)": {
				input: "Hello, _world\\_!",
				output: {
					type: "text",
					source: "Hello, _world\\_!",
					content: "Hello, _world_!",
				},
			},
			"italic with escaped delimiter (underscore)": {
				input: "Hello, _wor\\_ld_!",
				output: {
					type: "fragment",
					source: "Hello, _wor\\_ld_!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "italic",
							source: "_wor\\_ld_",
							children: {
								type: "text",
								source: "wor\\_ld",
								content: "wor_ld",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"italic with newline (underscore)": {
				input: "Hello, _\nworld_!",
				output: {
					type: "text",
					source: "Hello, _\nworld_!",
					content: "Hello, _\nworld_!",
				},
			},
			"italic (asterisk)": {
				input: "Hello, *world*!",
				output: {
					type: "fragment",
					source: "Hello, *world*!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "italic",
							source: "*world*",
							children: {
								type: "text",
								source: "world",
								content: "world",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"italic with start delimited escaped (asterisk)": {
				input: "Hello, \\*world*!",
				output: {
					type: "text",
					source: "Hello, \\*world*!",
					content: "Hello, *world*!",
				},
			},
			"italic with end delimited escaped (asterisk)": {
				input: "Hello, *world\\*!",
				output: {
					type: "text",
					source: "Hello, *world\\*!",
					content: "Hello, *world*!",
				},
			},
			"italic with escaped delimiter (asterisk)": {
				input: "Hello, *wor\\*ld*!",
				output: {
					type: "fragment",
					source: "Hello, *wor\\*ld*!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "italic",
							source: "*wor\\*ld*",
							children: {
								type: "text",
								source: "wor\\*ld",
								content: "wor*ld",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"italic with newline (asterisk)": {
				input: "Hello, *\nworld*!",
				output: {
					type: "text",
					source: "Hello, *\nworld*!",
					content: "Hello, *\nworld*!",
				},
			},
			"bold and italic": {
				input: "Hello, ***world***!",
				output: {
					type: "fragment",
					source: "Hello, ***world***!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "bold",
							source: "***world***",
							children: {
								type: "italic",
								source: "*world*",
								children: {
									type: "text",
									source: "world",
									content: "world",
								},
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			strike: {
				input: "Hello, ~~world~~!",
				output: {
					type: "fragment",
					source: "Hello, ~~world~~!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "strike",
							source: "~~world~~",
							children: {
								type: "text",
								source: "world",
								content: "world",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"strike with start delimited escaped": {
				input: "Hello, \\~~world~~!",
				output: {
					type: "text",
					source: "Hello, \\~~world~~!",
					content: "Hello, ~~world~~!",
				},
			},
			"strike with end delimited escaped": {
				input: "Hello, ~~world\\~~!",
				output: {
					type: "text",
					source: "Hello, ~~world\\~~!",
					content: "Hello, ~~world~~!",
				},
			},
			"strike with escaped asterisk": {
				input: "Hello, ~~wor\\~\\~ld~~!",
				output: {
					type: "fragment",
					source: "Hello, ~~wor\\~\\~ld~~!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "strike",
							source: "~~wor\\~\\~ld~~",
							children: {
								type: "text",
								source: "wor\\~\\~ld",
								content: "wor~~ld",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"strike with newline": {
				input: "Hello, ~~\nworld~~!",
				output: {
					type: "text",
					source: "Hello, ~~\nworld~~!",
					content: "Hello, ~~\nworld~~!",
				},
			},
			"code (single backtick)": {
				input: "Hello, `world`!",
				output: {
					type: "fragment",
					source: "Hello, `world`!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "code",
							source: "`world`",
							content: "world",
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"code with trailing and leading whitespace (single backtick)": {
				input: "Hello, ` world `!",
				output: {
					type: "fragment",
					source: "Hello, ` world `!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "code",
							source: "` world `",
							content: "world",
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"code with start delimited escaped (single backtick)": {
				input: "Hello, \\`world`!",
				output: {
					type: "text",
					source: "Hello, \\`world`!",
					content: "Hello, `world`!",
				},
			},
			"code with end delimited escaped (single backtick)": {
				input: "Hello, `world\\`!",
				output: {
					type: "text",
					source: "Hello, `world\\`!",
					content: "Hello, `world`!",
				},
			},
			"code with escaped backtick (single backtick)": {
				input: "Hello, `wor\\`ld`!",
				output: {
					type: "fragment",
					source: "Hello, `wor\\`ld`!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "code",
							source: "`wor\\`ld`",
							content: "wor`ld",
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"code (double backtick)": {
				input: "Hello, ``world``!",
				output: {
					type: "fragment",
					source: "Hello, ``world``!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "code",
							source: "``world``",
							content: "world",
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"code with trailing and leading whitespace (double backtick)": {
				input: "Hello, `` world ``!",
				output: {
					type: "fragment",
					source: "Hello, `` world ``!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "code",
							source: "`` world ``",
							content: "world",
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"code with start delimited escaped (double backtick)": {
				input: "Hello, \\``world``!",
				output: {
					type: "fragment",
					source: "Hello, \\``world``!",
					children: [
						{
							type: "text",
							source: "Hello, \\`",
							content: "Hello, `",
						},
						{
							type: "code",
							source: "`world`",
							content: "world",
						},
						{
							type: "text",
							source: "`!",
							content: "`!",
						},
					],
				},
			},
			"code with end delimited escaped (double backtick)": {
				input: "Hello, ``world\\``!",
				output: {
					type: "fragment",
					source: "Hello, ``world\\``!",
					children: [
						{
							type: "text",
							source: "Hello, `",
							content: "Hello, `",
						},
						{
							type: "code",
							source: "`world\\``",
							content: "world`",
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"code with escaped backtick (double backtick)": {
				input: "Hello, ``wor\\`ld``!",
				output: {
					type: "fragment",
					source: "Hello, ``wor\\`ld``!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "code",
							source: "``wor\\`ld``",
							content: "wor`ld",
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"code with unescaped backtick (double backtick)": {
				input: "Hello, ``wor`ld``!",
				output: {
					type: "fragment",
					source: "Hello, ``wor`ld``!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "code",
							source: "``wor`ld``",
							content: "wor`ld",
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"code with newline": {
				input: "Hello, `\nworld`!",
				output: {
					type: "text",
					source: "Hello, `\nworld`!",
					content: "Hello, `\nworld`!",
				},
			},
			link: {
				input: "Hello, [world](image.png)!",
				output: {
					type: "fragment",
					source: "Hello, [world](image.png)!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "link",
							source: "[world](image.png)",
							href: "image.png",
							children: {
								type: "text",
								source: "world",
								content: "world",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"link with spaces": {
				input: "Hello, [world]( image.png )!",
				output: {
					type: "fragment",
					source: "Hello, [world]( image.png )!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "link",
							source: "[world]( image.png )",
							href: "image.png",
							children: {
								type: "text",
								source: "world",
								content: "world",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"fenced code (unsupported)": {
				input: "Hello, ```world```!",
				output: {
					type: "text",
					source: "Hello, ```world```!",
					content: "Hello, ```world```!",
				},
			},
			"fenced code unbalanced (unsupported)": {
				input: "Hello, ``world```!",
				output: {
					type: "text",
					source: "Hello, ``world```!",
					content: "Hello, ``world```!",
				},
			},
			"link with start delimiter escaped": {
				input: "Hello, \\[world](image.png)!",
				output: {
					type: "text",
					source: "Hello, \\[world](image.png)!",
					content: "Hello, [world](image.png)!",
				},
			},
			"link with escaped left bracket": {
				input: "Hello, [wor\\[ld](image.png)!",
				output: {
					type: "fragment",
					source: "Hello, [wor\\[ld](image.png)!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "link",
							source: "[wor\\[ld](image.png)",
							href: "image.png",
							children: {
								type: "text",
								source: "wor\\[ld",
								content: "wor[ld",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"link with escaped right bracket": {
				input: "Hello, [wor\\]ld](image.png)!",
				output: {
					type: "fragment",
					source: "Hello, [wor\\]ld](image.png)!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "link",
							source: "[wor\\]ld](image.png)",
							href: "image.png",
							children: {
								type: "text",
								source: "wor\\]ld",
								content: "wor]ld",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"link with escaped left parenthesis": {
				input: "Hello, [world](https://\\(example.com)!",
				output: {
					type: "fragment",
					source: "Hello, [world](https://\\(example.com)!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "link",
							source: "[world](https://\\(example.com)",
							href: "https://(example.com",
							children: {
								type: "text",
								source: "world",
								content: "world",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"link with escaped right parenthesis": {
				input: "Hello, [world](image.png\\))!",
				output: {
					type: "fragment",
					source: "Hello, [world](image.png\\))!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "link",
							source: "[world](image.png\\))",
							href: "image.png)",
							children: {
								type: "text",
								source: "world",
								content: "world",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"link with formatted text": {
				input: "Hello, [**world**](image.png)!",
				output: {
					type: "fragment",
					source: "Hello, [**world**](image.png)!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "link",
							source: "[**world**](image.png)",
							href: "image.png",
							children: {
								type: "bold",
								source: "**world**",
								children: {
									type: "text",
									source: "world",
									content: "world",
								},
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"link with title": {
				input: 'Hello, [world](image.png "The world")!',
				output: {
					type: "fragment",
					source: 'Hello, [world](image.png "The world")!',
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "link",
							source: '[world](image.png "The world")',
							href: "image.png",
							title: "The world",
							children: {
								type: "text",
								source: "world",
								content: "world",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"link with title and escaped quote": {
				input: 'Hello, [world](image.png "The \\"world\\"")!',
				output: {
					type: "fragment",
					source: 'Hello, [world](image.png "The \\"world\\"")!',
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "link",
							source: '[world](image.png "The \\"world\\"")',
							href: "image.png",
							title: 'The "world"',
							children: {
								type: "text",
								source: "world",
								content: "world",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			image: {
				input: "Hello, ![world](image.png)!",
				output: {
					type: "fragment",
					source: "Hello, ![world](image.png)!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "image",
							source: "![world](image.png)",
							src: "image.png",
							alt: "world",
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"image with start delimiter escaped": {
				input: "Hello, \\![world](image.png)!",
				output: {
					type: "fragment",
					source: "Hello, \\![world](image.png)!",
					children: [
						{
							type: "text",
							source: "Hello, \\!",
							content: "Hello, !",
						},
						{
							type: "link",
							source: "[world](image.png)",
							href: "image.png",
							children: {
								type: "text",
								source: "world",
								content: "world",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"image with escaped left bracket": {
				input: "Hello, ![wor\\[ld](image.png)!",
				output: {
					type: "fragment",
					source: "Hello, ![wor\\[ld](image.png)!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "image",
							source: "![wor\\[ld](image.png)",
							src: "image.png",
							alt: "wor[ld",
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"image with escaped right bracket": {
				input: "Hello, ![wor\\]ld](image.png)!",
				output: {
					type: "fragment",
					source: "Hello, ![wor\\]ld](image.png)!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "image",
							source: "![wor\\]ld](image.png)",
							src: "image.png",
							alt: "wor]ld",
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"image with escaped left parenthesis": {
				input: "Hello, ![world](https://\\(example.com)!",
				output: {
					type: "fragment",
					source: "Hello, ![world](https://\\(example.com)!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "image",
							source: "![world](https://\\(example.com)",
							src: "https://(example.com",
							alt: "world",
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"image with escaped right parenthesis": {
				input: "Hello, ![world](image.png\\))!",
				output: {
					type: "fragment",
					source: "Hello, ![world](image.png\\))!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "image",
							source: "![world](image.png\\))",
							src: "image.png)",
							alt: "world",
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"image with formatted text": {
				input: "Hello, ![**world**](image.png)!",
				output: {
					type: "fragment",
					source: "Hello, ![**world**](image.png)!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "image",
							source: "![**world**](image.png)",
							src: "image.png",
							alt: "**world**",
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"link with image": {
				input: "Hello, [![world](image.png)](https://example.com)!",
				output: {
					type: "fragment",
					source: "Hello, [![world](image.png)](https://example.com)!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "link",
							source: "[![world](image.png)](https://example.com)",
							href: "https://example.com",
							children: {
								type: "image",
								source: "![world](image.png)",
								src: "image.png",
								alt: "world",
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"mixed formatting": {
				input: "Hello, **_~~`[world](image.png)`~~_**!",
				output: {
					type: "fragment",
					source: "Hello, **_~~`[world](image.png)`~~_**!",
					children: [
						{
							type: "text",
							source: "Hello, ",
							content: "Hello, ",
						},
						{
							type: "bold",
							source: "**_~~`[world](image.png)`~~_**",
							children: {
								type: "italic",
								source: "_~~`[world](image.png)`~~_",
								children: {
									type: "strike",
									source: "~~`[world](image.png)`~~",
									children: {
										type: "code",
										source: "`[world](image.png)`",
										content: "[world](image.png)",
									},
								},
							},
						},
						{
							type: "text",
							source: "!",
							content: "!",
						},
					],
				},
			},
			"unordered list": {
				input: "- Item one\n- Item two\n- Item three",
				output: {
					type: "list",
					ordered: false,
					source: "- Item one\n- Item two\n- Item three",
					children: [
						{
							type: "listItem",
							source: "- Item one\n",
							children: [
								{
									type: "text",
									source: "Item one",
									content: "Item one",
								},
							],
						},
						{
							type: "listItem",
							source: "- Item two\n",
							children: [
								{
									type: "text",
									source: "Item two",
									content: "Item two",
								},
							],
						},
						{
							type: "listItem",
							source: "- Item three",
							children: [
								{
									type: "text",
									source: "Item three",
									content: "Item three",
								},
							],
						},
					],
				},
			},
			"ordered list": {
				input: "1. First\n2. Second",
				output: {
					type: "list",
					ordered: true,
					source: "1. First\n2. Second",
					children: [
						{
							type: "listItem",
							source: "1. First\n",
							children: [
								{
									type: "text",
									source: "First",
									content: "First",
								},
							],
						},
						{
							type: "listItem",
							source: "2. Second",
							children: [
								{
									type: "text",
									source: "Second",
									content: "Second",
								},
							],
						},
					],
				},
			},
			"list with formatting and continuation lines": {
				input:
					"- **true**: A positive condition.\n  Continuation line.\n- **false**: Negative condition.",
				output: {
					type: "list",
					ordered: false,
					source:
						"- **true**: A positive condition.\n  Continuation line.\n- **false**: Negative condition.",
					children: [
						{
							type: "listItem",
							source:
								"- **true**: A positive condition.\n  Continuation line.\n",
							children: [
								{
									type: "bold",
									source: "**true**",
									children: {
										type: "text",
										source: "true",
										content: "true",
									},
								},
								{
									type: "text",
									source: ": A positive condition. Continuation line.",
									content: ": A positive condition. Continuation line.",
								},
							],
						},
						{
							type: "listItem",
							source: "- **false**: Negative condition.",
							children: [
								{
									type: "bold",
									source: "**false**",
									children: {
										type: "text",
										source: "false",
										content: "false",
									},
								},
								{
									type: "text",
									source: ": Negative condition.",
									content: ": Negative condition.",
								},
							],
						},
					],
				},
			},
			"lists flanked by headings and paragraphs": {
				input: "### Criteria\n- item 1\n- item 2\n\nSome trailing text.",
				output: {
					type: "fragment",
					source: "### Criteria\n- item 1\n- item 2\n\nSome trailing text.",
					children: [
						{
							type: "heading",
							depth: 3,
							source: "### Criteria",
							children: [
								{
									type: "text",
									source: "Criteria",
									content: "Criteria",
								},
							],
						},
						{
							type: "list",
							ordered: false,
							source: "- item 1\n- item 2\n",
							children: [
								{
									type: "listItem",
									source: "- item 1\n",
									children: [
										{
											type: "text",
											source: "item 1",
											content: "item 1",
										},
									],
								},
								{
									type: "listItem",
									source: "- item 2\n",
									children: [
										{
											type: "text",
											source: "item 2",
											content: "item 2",
										},
									],
								},
							],
						},
						{
							type: "paragraph",
							source: "Some trailing text.",
							children: [
								{
									type: "text",
									source: "Some trailing text.",
									content: "Some trailing text.",
								},
							],
						},
					],
				},
			},
		}),
	)("should parse %s", (_, { input, output }) => {
		expect(parse(input)).toEqual(output);
	});
});

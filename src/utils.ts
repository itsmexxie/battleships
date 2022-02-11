import chalk from "chalk";

type DEBUG_LEVEL = "INFO"  | "WARN" | "ERROR";

function isBetween(number: number, lowest: number, highest: number) {
	if(lowest <= number && number <= highest) return true;
	return false;
}

function decodeCoords(coord: string): [any, any] {
	let x = (parseInt(coord.slice(1, coord.length)) - 1), y = (coord[0].toUpperCase().charCodeAt(0) - 65);
	if(!isBetween(x, 0, 9) || !isBetween(y, 0, 9)) return [null, "Invalid coord"];
	return [[x, y], null];
}

function encodeCoords(coord: number[]): string {
	let x = coord[0] + 1, y = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"][coord[1]];
	return `${y}${x}`;
}

function debugFmt(content: string, level: DEBUG_LEVEL = "INFO") {
	switch(level) {
		case "INFO":
			return `[${new Date().toISOString()}] ${chalk.blue("INFO")}: ${content}`;

		case "WARN":
			return `[${new Date().toISOString()}] ${chalk.yellow("WARN")}: ${content}`;

		case "ERROR":
			return `[${new Date().toISOString()}] ${chalk.red("ERROR")}: ${content}`;
	}
}

export default {
	isBetween,
	decodeCoords,
	encodeCoords,
	debugFmt
};

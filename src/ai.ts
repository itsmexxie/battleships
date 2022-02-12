import EventEmitter from "events";
import { Board, SHIP_TYPES } from "./game";
import utils from "./utils";
import argv from "./argv";

enum AI_STATE {
	STARTING,
	WAITING,
	PLAYING
};

enum AI_MODE {
	SEARCH,
	TARGET
};

interface ProbabilityGroup {
	probability: number,
	cells: number[][]
};

class AI extends EventEmitter {
	state: AI_STATE;
	mode: AI_MODE;
	boards: Board[];
	currAttack: number[];
	target: { cellList: number[][], length: number };
	output: NodeJS.WriteStream;
	input: NodeJS.ReadStream;

	constructor(boards: Board[], state?: AI_STATE, mode?: AI_MODE) {
		super();
		this.state = state || AI_STATE.STARTING;
		this.mode = mode || AI_MODE.SEARCH;
		this.boards = boards;
		this.currAttack = [];
		this.target = {
			cellList: [],
			length: 0
		};
		this.output = process.stdout;
		this.input = process.stdin;

		// Process input data
		this.input.on("data", (data) => {
			let parsed = data.toString().trim();
			if(argv.d) console.log(utils.debugFmt(`Received data on stdin: ${parsed}`));
			this.emit("input", parsed);
		});

		if(argv.d) console.log(utils.debugFmt(`Initialized AI with the following properties: state = ${AI_STATE[this.state]}, mode = ${AI_MODE[this.mode]}`));
	}

	shoot() {
		switch(this.mode) {
			case AI_MODE.SEARCH:
				let probabilityList = this.calculateSearchProbabilities();
				this.currAttack = probabilityList[0].cells[Math.floor(Math.random() * probabilityList[0].cells.length)];
				if(argv.d) console.log(utils.debugFmt(`Picking one of the cells with the currently highest probability (${probabilityList[0].probability}): ${probabilityList[0].cells.join("; ")}...`));
				this.output.write(utils.encodeCoords(this.currAttack) + "\n");
				break;

			case AI_MODE.TARGET:
				// Implement target mode
				break;

			default:
				break;
		}
	}

	respondToAttack(coord: string) {
		let [parsedCoord, error] = utils.decodeCoords(coord);
		if(error) {
			if(argv.d) console.log(utils.debugFmt(`Invalid coordinate ${coord}!`, "ERROR"));
			return;
		}

		if(argv.d) console.log(utils.debugFmt(`Looking up cell [x: ${parsedCoord[0]}, y: ${parsedCoord[1]}] / ${coord}...`));
		let cellContent = this.boards[0].cells[parsedCoord[0]][parsedCoord[1]];
		if(argv.d) console.log(utils.debugFmt(`Found ${cellContent}`));
		if(cellContent != 0) {
			let a = "";
			let ship = this.boards[0].ships.get(cellContent);
			if(ship) {
				ship.damage(1);
				this.boards[0].cells[parsedCoord[0]][parsedCoord[1]] = 0;
				a += "hit";
				if(ship.health <= 0) {
					this.boards[0].ships.delete(cellContent);
					a += ", sunk";
				}
				if(this.boards[0].ships.size <= 0) {
					a += ", end";
					// TODO: Implement end
				}
			}
			this.output.write(a + "\n");
		} else {
			this.output.write("miss\n");
		}

		this.changeState(AI_STATE.PLAYING);
	}

	calculateSearchProbabilities(): ProbabilityGroup[] {
		let a: ProbabilityGroup[] = [];
		for(let i = 0; i < this.boards[1].rows; i++) {
			for(let j = 0; j < this.boards[1].columns; j++) {
				let probability = 0;
				if(this.boards[1].cells[j][i] == -1) {
					// TODO: Change to account for sunk ships
					for(const shipType of SHIP_TYPES) {
						if(shipType.length == 1) {
							probability += 1;
							continue;
						}
						for(let k = 0; k < 4; k++) {
							let canFit = true;
							for(let m = 0; m < shipType.length; m++) {
								if(!utils.isBetween((k <= 1 ? i : j) + (k % 2 == 0 ? m : -m), 0, 9)) canFit = false;
								else {
									if(this.boards[1].cells[j + (k <= 1 ? 0 : (k % 2 == 0 ? m : -m))][i + (k <= 1 ? (k % 2 == 0 ? m : -m) : 0)] != -1) canFit = false;
								}
							}
							if(canFit) probability += shipType.count;
						}
					}
				}
				let pgroup = a.find(x => x.probability == probability);
				if(!pgroup) a.push({ probability: probability, cells: [[j, i]] });
				else pgroup.cells.push([j, i]);
			}
		}
		a.sort((firstEl, secondEl) => {
			if(firstEl.probability > secondEl.probability) return -1;
			else return 1;
		});
		return a;
	}

	changeState(newState: AI_STATE) {
		if(argv.d) console.log(utils.debugFmt(`Changed AI state from ${AI_STATE[this.state]} to ${AI_STATE[newState]}`));
		this.state = newState;
		this.emit("state_change", newState);
	}

	changeMode(newMode: AI_MODE) {
		if(argv.d) console.log(utils.debugFmt(`Changed AI mode from ${AI_MODE[this.mode]} to ${AI_MODE[newMode]}`));
		this.mode = newMode;
		this.emit("mode_change");
	}
}

export {
	AI,
	AI_STATE,
	AI_MODE
};

import EventEmitter from "events";
import { Board, SHIP_TYPES } from "./game";
import utils from "./utils";
import argv from "./argv";

enum AI_STATE {
	STARTING,
	WAITING,
	PLAYING,
	END
};

enum AI_MODE {
	SEARCHING
};

class AI extends EventEmitter {
	state: AI_STATE;
	mode: AI_MODE;
	boards: Board[];
	probabilityMap: number[][];
	output: NodeJS.WriteStream;
	input: NodeJS.ReadStream;

	constructor(boards: Board[], state?: AI_STATE, mode?: AI_MODE) {
		super();
		this.state = state || AI_STATE.STARTING;
		this.mode = mode || AI_MODE.SEARCHING;
		this.boards = boards;
		this.probabilityMap = [];
		this.output = process.stdout;
		this.input = process.stdin;

		// Generate ships on our board
		Board.generateShips(this.boards[0]);

		// Fill probability map with zeros
		for(let i = 0; i < 10; i++) {
			this.probabilityMap.push(new Array(10).fill(0));
		}

		// Calculate baseline probabilities
		for(let i = 0; i < 10; i++) {
			for(let j = 0; j < 10; j++) {
				let probability = 0;
				for(const shipType of SHIP_TYPES) {
					if(shipType.length == 1) {
						probability += 1;
						continue;
					}
					for(let k = 0; k < 4; k++) {
						let canFit = true;
						for(let m = 0; m < shipType.length; m++) {
							if(!utils.isBetween((k <= 1 ? i : j) + (k % 2 == 0 ? m : -m), 0, 9)) canFit = false;
						}
						if(canFit) probability += shipType.count;
					}
				}
				this.probabilityMap[j][i] = probability;
			}
		}

		// Process input data
		this.input.on("data", (data) => {
			let parsed = data.toString().trim();
			if(argv.d) console.log(utils.debugFmt(`Received data on stdin: ${parsed}`));
			this.emit("input", parsed);
		});

		this.on("end", () => {
			process.exit(0);
		});

		if(argv.d) console.log(utils.debugFmt(`Initialized AI with the following properties: state = ${AI_STATE[this.state]}, mode = ${AI_MODE[this.mode]}`));
	}

	shoot() {
		console.log("Pew!");
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
					this.state = AI_STATE.END;
					this.emit("end");
				}
			}
			this.output.write(a + "\n");
		} else {
			this.output.write("miss\n");
		}

		if(this.state != AI_STATE.END) this.changeState(AI_STATE.PLAYING);
	}

	changeState(newState: AI_STATE) {
		if(argv.d) console.log(utils.debugFmt(`Changed AI state from ${AI_STATE[this.state]} to ${AI_STATE[newState]}`));
		this.state = newState;
		this.emit("state_change", newState);
	}

	changeStrategy(newMode: AI_MODE) {
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

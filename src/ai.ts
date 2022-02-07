import EventEmitter from "events";
import { Board } from "./game";
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
	output: NodeJS.WriteStream;
	input: NodeJS.ReadStream;

	constructor(boards: Board[], state?: AI_STATE, mode?: AI_MODE) {
		super();
		this.state = state || AI_STATE.STARTING;
		this.mode = mode || AI_MODE.SEARCHING;
		this.boards = boards;
		this.output = process.stdout;
		this.input = process.stdin;

		Board.generateShips(this.boards[0]);

		this.input.on("data", (data) => {
			let parsed = data.toString().trim();
			if(argv.d) console.log(utils.debugFmt(`Received data on stdin: ${parsed}`));
			this.emit("input", parsed);
		});

		if(argv.d) console.log(utils.debugFmt(`Initialized AI with the following properties: state = ${AI_STATE[this.state]}, mode = ${AI_MODE[this.mode]}`));
	}

	shoot() {

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
					this.changeState(AI_STATE.END);
				}
			}
			this.output.write(a + "\n");
		} else {
			this.output.write("miss\n");
		}
	}

	changeState(newState: AI_STATE) {
		if(argv.d) console.log(utils.debugFmt(`Changed AI state from ${AI_STATE[this.state]} to ${AI_STATE[newState]}`));
		this.state = newState;
		this.emit("state_change", newState);
	}

	changeStrategy(newMode: AI_MODE) {
		this.mode = newMode;
	}
}

export {
	AI,
	AI_STATE,
	AI_MODE
};

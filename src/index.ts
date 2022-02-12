import { AI, AI_MODE, AI_STATE } from "./ai";
import { Board, SHIP_TYPES } from "./game";
import utils from "./utils";

// Initialize some stuff
// boards[0] - Our board, boards[1] - Opponent's board
const ai = new AI([new Board(10, 10), new Board(10, 10, true)]);

// Listen for input
ai.on("input", (data: string) => {
	switch(ai.state) {
		case AI_STATE.STARTING:
			let parsedData = parseInt(data);
			if(!(parsedData == 0 || parsedData == 1)) return;
			ai.changeState(parseInt(data) + 1);
			break;

		case AI_STATE.WAITING:
			ai.respondToAttack(data);
			break;

		case AI_STATE.PLAYING:
			let cmds = data.split(", ");
			if(cmds.length == 3) process.exit(0); // TODO: Implement end
			if(cmds[0] == "miss") {
				ai.boards[1].cells[ai.currAttack[0]][ai.currAttack[1]] = 0;
			} else {
				ai.boards[1].cells[ai.currAttack[0]][ai.currAttack[1]] = 1;
				if(cmds.length == 2) {
					for(const [key, value] of ai.boards[1].ships.entries()) {
						if(value.length == ai.target.length) {
							ai.boards[1].ships.delete(key);
							break;
						}
					}
					ai.changeMode(AI_MODE.SEARCH);
				} else {
					ai.target.cellList.push(ai.currAttack);
					ai.target.length += 1;
					if(ai.mode != AI_MODE.TARGET) ai.changeMode(AI_MODE.TARGET);
				}
			}
			ai.changeState(AI_STATE.WAITING);
			break;
	}
});

ai.on("state_change", (newState) => {
	switch(newState) {
		case AI_STATE.PLAYING:
			ai.shoot();
			break;
	}
});

// Print out our board
let a = "";
for(let i = 0; i < ai.boards[0].rows; i++) {
	for(let j = 0; j < ai.boards[0].columns; j++) {
		if(ai.boards[0].cells[j][i] == 0) a += ".";
		else a += "X";
	}
	a += "\n";
}
ai.output.write(a);

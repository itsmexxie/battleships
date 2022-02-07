import { AI, AI_STATE } from "./ai";
import { Board } from "./game";

// Initialize some stuff
// boards[0] - Our board, boards[1] - Opponent's board
const ai = new AI([new Board(10, 10, 0), new Board(10, 10, -1)]);

// Listen for input
ai.on("input", (data) => {
	switch(ai.state) {
		case AI_STATE.STARTING:
			if(!(data == 0 || data == 1)) return;
			ai.changeState(parseInt(data) + 1);
			break;

		case AI_STATE.WAITING:
			ai.respondToAttack(data);
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

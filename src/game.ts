const SHIP_TYPES = [
	{ type: "A", length: 5, count: 1 },
	{ type: "B", length: 4, count: 1 },
	{ type: "C", length: 3, count: 2 },
	{ type: "D", length: 2, count: 2 },
	{ type: "E", length: 1, count: 1 }
];

class Board {
	rows: number;
	columns: number;
	/**
	 * @description 0 - water; "XY" - X = ship type ID, Y = n of ship type, 2 - destroyed cell
	 */
	cells: any[][];
	ships: Map<string, Ship>;

	constructor(rows: number, columns: number, defaultCell: number) {
		this.rows = rows;
		this.columns = columns;
		this.cells = [];
		this.ships = new Map<string, Ship>();

		for(let i = 0; i < this.columns; i++) {
			this.cells.push([]);
			for(let j = 0; j < this.rows; j++) {
				this.cells[i].push(defaultCell);
			}
		}
	}

	/**
	 * @param id "XY" - X = ship type ID, Y = n of ship type
	 */
	static generateShip(id: string, length: number, board: Board): void {
		let success = false;
		let newShip: Ship;
		// Try generating a ship until successfull
		do {
			let orientation = Math.round(Math.random());
			let maxPos = (orientation == 0 ? board.columns : board.rows) - length;
			let pos = [Math.round(Math.random() * (orientation == 0 ? maxPos : board.columns - 1)), Math.round(Math.random() * (orientation == 0 ? board.rows - 1 : maxPos))];
			newShip = new Ship(length, orientation, pos);
			success = Ship.doesFit(newShip, board);
		} while (!success);
		// Load the ship into the board's cells
		for(const cell of newShip.cells()) {
			board.cells[cell[0]][cell[1]] = id;
		}
		// Put the ship into board's ship array
		board.ships.set(id, newShip);
	}

	static generateShips(board: Board): void {
		for(const shipType of SHIP_TYPES) {
			for(let i = 0; i < shipType.count; i++) {
				Board.generateShip(`${shipType.type}${i}`, shipType.length, board);
			}
		}
	}
}

class Ship {
	length: number;			// 1 - 5
	orientation: number;	// 0 - West-East, 1 - North-South
	pos: number[];			// coordinates of the most NorthWest cell
	health: number;

	constructor(length: number, orientation: number,  pos: number[]) {
		this.length = length;
		this.orientation = orientation;
		this.pos = pos;
		this.health = length;
	}

	cells(): number[][] {
		let cellList: number[][] = [];
		for(let i = 0; i < this.length; i++) {
			if(this.orientation == 0) {
				cellList.push([this.pos[0] + i, this.pos[1]]);
			} else {
				cellList.push([this.pos[0], this.pos[1] + i]);
			}
		}
		return cellList;
	}

	damage(power: number) {
		this.health -= power;
	}

	static doesFit(ship: Ship, board: Board): boolean {
		let cellList = ship.cells();

		for(const cell of cellList) {
			// Check other ships actuall cells
			if(board.cells[cell[0]][cell[1]] != 0) return false;
			// Check other ships sides
			if(cell[0] != 0 && board.cells[cell[0] - 1][cell[1]] != 0) return false;
			if(cell[0] != 9 && board.cells[cell[0] + 1][cell[1]] != 0) return false;
			if(cell[1] != 0 && board.cells[cell[0]][cell[1] - 1] != 0) return false;
			if(cell[1] != 9 && board.cells[cell[0]][cell[1] + 1] != 0) return false;
		}

		return true;
	}
}

export {
	Board,
	Ship
};

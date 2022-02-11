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
	 * @description 0 - water; "XY" - X = ship type ID, Y = n of ship type, 0 - destroyed cell
	 */
	cells: any[][];
	ships: Map<string, Ship>;

	constructor(rows: number, columns: number, isEnemy?: boolean) {
		this.rows = rows;
		this.columns = columns;
		this.cells = [];
		this.ships = new Map<string, Ship>();

		for(let i = 0; i < this.columns; i++) {
			this.cells.push(new Array(this.rows).fill(isEnemy ? -1 : 0));
		}

		if(isEnemy) {
			for(const shipType of SHIP_TYPES) {
				for(let i = 0; i < shipType.count; i++) {
					this.ships.set(`${shipType.type}${i}`, new Ship(shipType.length, -1, [-1, -1]));
				}
			}
		} else {
			this.generateShips();
		}
	}

	/**
	 * @param id "XY" - X = ship type ID, Y = n of ship type
	 */
	private generateShip(id: string, length: number): void {
		let success = true;
		let newShip: Ship;
		// Try generating a ship until successfull
		do {
			success = true;
			let orientation = Math.round(Math.random());
			let maxPos = (orientation == 0 ? this.columns : this.rows) - length;
			let pos = [Math.round(Math.random() * (orientation == 0 ? maxPos : this.columns - 1)), Math.round(Math.random() * (orientation == 0 ? this.rows - 1 : maxPos))];

			newShip = new Ship(length, orientation, pos);
			let cellList = newShip.cells();
			for(const cell of cellList) {
				// Check other ships actuall cells
				if(this.cells[cell[0]][cell[1]] != 0) success = false;
				// Check other ships sides
				if(cell[0] != 0 && this.cells[cell[0] - 1][cell[1]] != 0) success = false;
				if(cell[0] != 9 && this.cells[cell[0] + 1][cell[1]] != 0) success = false;
				if(cell[1] != 0 && this.cells[cell[0]][cell[1] - 1] != 0) success = false;
				if(cell[1] != 9 && this.cells[cell[0]][cell[1] + 1] != 0) success = false;
			}
		} while (!success);
		// Load the ship into the boards's cells
		for(const cell of newShip.cells()) {
			this.cells[cell[0]][cell[1]] = id;
		}
		// Put the ship into this's ship array
		this.ships.set(id, newShip);
	}

	private generateShips(): void {
		for(const shipType of SHIP_TYPES) {
			for(let i = 0; i < shipType.count; i++) {
				this.generateShip(`${shipType.type}${i}`, shipType.length);
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
}


export {
	Board,
	Ship,
	SHIP_TYPES
};

import yargs from "yargs/yargs";

const argv = yargs(process.argv.slice(2)).options({
	d: { type: 'boolean', default: false }
}).parseSync();

export default argv;

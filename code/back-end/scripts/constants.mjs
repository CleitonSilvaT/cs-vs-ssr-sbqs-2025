const SERVER_URL = "http://localhost:3000/data?";
const CLIENT_URL = "http://localhost:5500/front-end";
const SIZES = ["extra-small"];
// const SIZES = ["extra-small", "small", "medium", "large", "extra-large"];

const FORMATS = ["json", "html"];
const NUM_EXECUTIONS = 1;

const SCENARIOS = [{ order: "extra-small", sizes: SIZES }];

export { CLIENT_URL, SERVER_URL, SIZES, FORMATS, NUM_EXECUTIONS, SCENARIOS };

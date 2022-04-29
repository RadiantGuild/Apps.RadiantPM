import {render} from "react-dom";
import {styled} from "./stitches.config";

const app = document.querySelector<HTMLDivElement>("#app");

const Text = styled("p", {
    fontFamily: "$text",
    fontSize: "1rem"
});

render(<Text>Hello, world!</Text>, app);

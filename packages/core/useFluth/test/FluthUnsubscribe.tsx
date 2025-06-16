import { defineComponent } from "vue";
import { Stream } from "../index";

interface Props {
  stream: Stream<number>;
}

export default defineComponent(
  (props: Props) => {
    props.stream?.then((value) => console.log(value));
    return () => <div>hello</div>;
  },
  {
    name: "FluthJSXTest",
    props: ["stream"],
  },
);
